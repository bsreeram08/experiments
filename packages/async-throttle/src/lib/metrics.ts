/**
 * Metrics tracking for AsyncThrottle
 */

export interface Metrics {
    /** Total tasks added to queue */
    totalTasks: number;
    /** Tasks currently in queue (not yet executing) */
    queued: number;
    /** Tasks currently executing */
    active: number;
    /** Successfully completed tasks */
    succeeded: number;
    /** Failed tasks (after retries) */
    failed: number;
    /** Cancelled tasks */
    cancelled: number;
    /** Timed out tasks */
    timedOut: number;
    /** Average task latency in ms */
    avgLatency: number;
    /** Median latency (p50) in ms */
    p50: number;
    /** 95th percentile latency in ms */
    p95: number;
    /** 99th percentile latency in ms */
    p99: number;
    /** Latency histogram buckets */
    latencyHistogram: Record<string, number>;
}

export interface LatencyHistogramConfig {
    /** Bucket boundaries in milliseconds */
    buckets: number[];
}

const DEFAULT_BUCKETS = [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

export class MetricsCollector {
    private totalTasks = 0;
    private queued = 0;
    private active = 0;
    private succeeded = 0;
    private failed = 0;
    private cancelled = 0;
    private timedOut = 0;
    private latencies: number[] = [];
    private histogram: Map<number, number> = new Map();
    private buckets: number[];

    constructor(config?: LatencyHistogramConfig) {
        this.buckets = config?.buckets || DEFAULT_BUCKETS;
        // Initialize histogram buckets
        for (const bucket of this.buckets) {
            this.histogram.set(bucket, 0);
        }
        this.histogram.set(Infinity, 0); // Overflow bucket
    }

    /** Increment total tasks counter */
    taskAdded(): void {
        this.totalTasks++;
        this.queued++;
    }

    /** Move task from queued to active */
    taskStarted(): void {
        this.queued--;
        this.active++;
    }

    /** Record successful task completion */
    taskSucceeded(latency: number): void {
        this.active--;
        this.succeeded++;
        this.recordLatency(latency);
    }

    /** Record failed task */
    taskFailed(latency: number): void {
        this.active--;
        this.failed++;
        this.recordLatency(latency);
    }

    /** Record cancelled task */
    taskCancelled(latency: number): void {
        this.active--;
        this.cancelled++;
        this.recordLatency(latency);
    }

    /** Record timed out task */
    taskTimedOut(latency: number): void {
        this.active--;
        this.timedOut++;
        this.recordLatency(latency);
    }

    /** Record task latency and update histogram */
    private recordLatency(latency: number): void {
        this.latencies.push(latency);

        // Update histogram
        let added = false;
        for (const bucket of this.buckets) {
            if (latency <= bucket) {
                this.histogram.set(
                    bucket,
                    (this.histogram.get(bucket) || 0) + 1
                );
                added = true;
                break;
            }
        }
        if (!added) {
            // Overflow bucket
            this.histogram.set(
                Infinity,
                (this.histogram.get(Infinity) || 0) + 1
            );
        }
    }

    /** Calculate percentile from sorted array */
    private calculatePercentile(sorted: number[], percentile: number): number {
        if (sorted.length === 0) return 0;
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }

    /** Get current metrics snapshot */
    getMetrics(): Metrics {
        const sortedLatencies = [...this.latencies].sort((a, b) => a - b);
        const avgLatency =
            this.latencies.length > 0
                ? this.latencies.reduce((sum, l) => sum + l, 0) /
                  this.latencies.length
                : 0;

        const histogramRecord: Record<string, number> = {};
        for (const [bucket, count] of this.histogram.entries()) {
            const key = bucket === Infinity ? '∞' : `${bucket}ms`;
            histogramRecord[key] = count;
        }

        return {
            totalTasks: this.totalTasks,
            queued: this.queued,
            active: this.active,
            succeeded: this.succeeded,
            failed: this.failed,
            cancelled: this.cancelled,
            timedOut: this.timedOut,
            avgLatency: Math.round(avgLatency * 100) / 100,
            p50: this.calculatePercentile(sortedLatencies, 50),
            p95: this.calculatePercentile(sortedLatencies, 95),
            p99: this.calculatePercentile(sortedLatencies, 99),
            latencyHistogram: histogramRecord,
        };
    }

    /** Reset all metrics */
    reset(): void {
        this.totalTasks = 0;
        this.queued = 0;
        this.active = 0;
        this.succeeded = 0;
        this.failed = 0;
        this.cancelled = 0;
        this.timedOut = 0;
        this.latencies = [];
        this.histogram.clear();
        for (const bucket of this.buckets) {
            this.histogram.set(bucket, 0);
        }
        this.histogram.set(Infinity, 0);
    }
}

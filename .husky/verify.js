const { readFileSync } = require('fs');

const args = process.argv.slice(2);
if (args.length > 1) throw new Error(`Cannot have more than one args`);
let score = 4;
const commitMessage = readFileSync(args[0]).toString('utf-8');

const specialChars = /[`!@#$%^&()_+\-=\[\]{};':"\\|.<>\/?~]/;
/**
 * ? Comments for Debugging ?
 **/
// console.log(commitMessage);
// console.log(!commitMessage.includes(':'));
// console.log(commitMessage.split(':')[0][1].toUpperCase(), commitMessage.split(':')[0][1]);
// console.log(!commitMessage.split(':')[1], commitMessage.split(':')[1]?.length);
// console.log(
//     commitMessage.split(':')[0],
//     specialChars.test(commitMessage.split(':')[0]),
//     commitMessage.split(':')[1].trim(),
//     specialChars.exec(commitMessage.split(':')[1].trim())
// );

const errors = [];
if (!commitMessage.includes(':')) {
  errors.push('Commit requires title.');
  score--;
}
if (
  commitMessage.split(':')[0][1].toUpperCase() == commitMessage.split(':')[0][1]
) {
  errors.push(`Commit messages should starts with a lowercase.`);
  score--;
}
if (!commitMessage.split(':')[1] || commitMessage.split(':')[1].length < 30) {
  errors.push(
    `Commit message description should at-least be of 30 characters.`
  );
  score--;
}
if (specialChars.test(specialChars.test(commitMessage.split(':')[1]))) {
  errors.push(
    `Commit message must not contain the following special characters !@#$%^&()_+\-=\[\]{};':"\\|.<>\/?~`
  );
  score--;
}

/**
 * Verify score
 */

if (score != 4) {
  errors.push(`Invalid commit message. [score: ${score}/4]\n`);
  console.log(errors.join('\n'));
  process.exit(1);
} else console.log(`Commit message score: [${score}/4]`);

'use strict';
const inquirer = require('inquirer');
const axios = require('axios');
const yaml = require('js-yaml');

async function getStarterData(contentPath) {
  const {
    data: { content },
  } = await axios.get(
    `https://api.github.com/repos/strapi/community-content/contents/${contentPath}`
  );

  const buff = Buffer.from(content, 'base64');
  const stringified = buff.toString('utf-8');

  return yaml.load(stringified);
}

async function getPromptOptions(contentType) {
  const content = await getStarterData(`${contentType}/${contentType}.yml`);
  const options = content.map(option => {
    const contentOption = {
      name: option.title,
      value: `https://github.com/${option.repo}`,
    };

    return contentOption;
  });

  return options;
}

async function getPromptQuestions(projectName, askQuickstart, contentType) {
  const promptOptions = await getPromptOptions(contentType);
  const questions = {
    templates: [
      {
        type: 'input',
        default: projectName,
        name: 'directory',
        message: 'What would you like to name your project?',
      },
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Would you like to use a template?',
      },
      {
        type: 'list',
        name: 'selected',
        message: 'Choose a template?',
        pageSize: promptOptions.length,
        choices: promptOptions,
        when(answers) {
          return answers.confirm;
        },
      },
      {
        type: 'list',
        name: 'quick',
        message: 'Choose your installation type',
        choices: [
          {
            name: 'Quickstart (recommended)',
            value: true,
          },
          {
            name: 'Custom (manual settings)',
            value: false,
          },
        ],
        when: askQuickstart,
      },
    ],
    starters: [
      {
        type: 'input',
        default: projectName,
        name: 'directory',
        message: 'What would you like to name your project?',
      },
      {
        type: 'list',
        name: 'selected',
        message: 'Which starter would you like to use?',
        pageSize: promptOptions.length,
        choices: promptOptions,
      },
      {
        type: 'list',
        name: 'quick',
        message: 'Choose your installation type',
        choices: [
          {
            name: 'Quickstart (recommended)',
            value: true,
          },
          {
            name: 'Custom (manual settings)',
            value: false,
          },
        ],
        when: askQuickstart,
      },
    ],
  };

  return questions[contentType];
}

/**
 *
 * @param {string|null} projectName name/path of project
 * @param {boolean} askQuickstart has quickstart flag
 * @param {string} contentType starters or templates
 * @returns
 */
module.exports = async function promptUser(projectName, askQuickstart, contentType) {
  const questions = await getPromptQuestions(projectName, askQuickstart, contentType);
  const prompt = await inquirer.prompt(questions);

  return prompt;
};

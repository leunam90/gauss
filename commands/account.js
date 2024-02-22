/**
 * Module to manage accunts in sdfcli
 */
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const inquirer = require('inquirer');
const _routes = require('../routes');

module.exports = {
    issuetoken: () => {
        inquirer.prompt([
            {
                type: 'input',
                name: 'email',
                message: "Cuál es tu correo de acceso a netsuite:",
                validate: (value) => {
                    if (!value) return 'El correo es obligatorio';
                    return true;
                }
            },
            {
                type: 'input',
                name: 'author',
                message: "Cuál es tu nombre:",
                validate: (value) => {
                    if (!value) return 'El nombre es obligatorio';
                    return true;
                }
            },
            {
                type: 'input',
                name: 'accountid',
                message: "Cuál es el id de la cuenta:",
                validate: (value) => {
                    if (!value) return 'El id de la cuenta es obligatorio';
                    return true;
                }
            }
        ]).then((answers) => {
            let config = JSON.parse(fs.readFileSync(path.join(_routes.cwd, 'config.json')));
            config.author = answers.author;
            config.email = answers.email;
            inquirer.prompt({
                type: 'confirm',
                name: 'authid_exist',
                message: "Ya has creado anteriormente tu authid en la cuenta:",
            }).then((answer) => {
                if (!answer.authid_exist) {
                    const cmd = spawn(path.join(_routes.sdfcli, `sdfcli issuetoken -account ${answers.accountid} -email ${answers.email} -role ${config.role} -url ${config.url}`), { stdio: "inherit", stdin: "inherit", shell: true });
                    cmd.on("close", code => {
                        if (code) return;
                        inquirer.prompt([
                            {
                                type: 'input',
                                name: 'authid',
                                message: "Cuál es el authid:",
                                validate: (value) => {
                                    if (!value) return 'El authid obligatorio';
                                    return true;
                                }
                            }
                        ]).then((answer) => {  
                            config.authid = answer.authid;
                            fs.writeFile(path.join(_routes.cwd, 'config.json'), JSON.stringify(config, null, 4), 'utf8', (err) => { })
                        });
                    });
                }else{
                    inquirer.prompt([
                        {
                            type: 'input',
                            name: 'authid',
                            message: "Cuál es el authid:",
                            validate: (value) => {
                                if (!value) return 'El authid obligatorio';
                                return true;
                            }
                        }
                    ]).then((answer) => {
                        config.authid = answer.authid;
                        fs.writeFile(path.join(_routes.cwd, 'config.json'), JSON.stringify(config, null, 4), 'utf8', (err) => { })
                    });
                }
            })
        }).catch((err) => {
            console.log(err);
        });
    },
    authenticate: () => {
        const {authid} = JSON.parse(fs.readFileSync(path.join(_routes.cwd, 'config.json')));
        const cmd = spawn(path.join(_routes.sdfcli, `sdfcli authenticate -authid ${authid}`), { stdio: "inherit", stdin: "inherit", shell: true });
        cmd.on("close", code => { if (code) return;});
    }
}
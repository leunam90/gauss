/**
 * Module to create new script files, scripts records
 */
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const inquirer = require('inquirer');
const _routes = require('../routes');

module.exports = {
    deploy: () => {
        const config = JSON.parse(fs.readFileSync(path.join(_routes.cwd, 'config.json')));
        const cmd = spawn(path.join(_routes.sdfcli, `sdfcli adddependencies -all -authid ${config.authid}  -p ${_routes.cwd}`), { stdio: "inherit", stdin: "inherit", shell: true });
        cmd.on("close", code => {
            if (code) return;
            spawn(path.join(_routes.sdfcli, `sdfcli deploy -authid ${config.authid}  -p ${_routes.cwd}`), { stdio: "inherit", stdin: "inherit", shell: true });            
        });
    },
    upload: (file) => {
        const config = JSON.parse(fs.readFileSync(path.join(_routes.cwd, 'config.json')));
        const apptype = fs.readFileSync(path.join(_routes.cwd, 'manifest.xml'), 'utf8').match(/(SUITEAPP|ACCOUNTCUSTOMIZATION)/)[0];
        const sdfclicmd = (fs.existsSync(path) && fs.lstatSync(path).isDirectory()) ? 'uploadfolders' : 'uploadfiles';
        file = file.replace((/(FileCabinet|SuiteApps|SuiteScripts|\\|\/)/g), '').replace(config.name, '');

        if (apptype == 'SUITEAPP') upload_path = `/SuiteApps/${config.name}/${file}`;
        if (apptype == 'ACCOUNTCUSTOMIZATION') upload_path = `/SuiteScripts/${config.name}/${file}`;
        console.log(`sdfcli ${sdfclicmd} -authid ${config.authid} -paths ${upload_path} -p ${_routes.cwd}`)
        const cmd = spawn(path.join(_routes.sdfcli, `sdfcli ${sdfclicmd} -authid ${config.authid} -paths ${upload_path} -p ${_routes.cwd}`), { stdio: "inherit", stdin: "inherit", shell: true });
    },
    create: () => {
        const script = {};
        const config = JSON.parse(fs.readFileSync(path.join(_routes.cwd, 'config.json')));
        const apptype = fs.readFileSync(path.join(_routes.cwd, 'manifest.xml'), 'utf8').match(/(SUITEAPP|ACCOUNTCUSTOMIZATION)/)[0];
        inquirer.prompt([
            {
                type: 'list',
                name: 'type',
                prefix: '👾',
                message: "Selecciona el tipo de script:",
                choices: Object.entries(JSON.parse(fs.readFileSync(_routes.scripts))).map((el, index) => el[0]),
            },
        ]).then((answer) => {
            const script_type = JSON.parse(fs.readFileSync(_routes.scripts));
            script['record'] = answer.type;
            script['type'] = script_type[answer.type]['name'];
            inquirer.prompt([
                {
                    type: 'checkbox',
                    name: 'entrypoint',
                    prefix: '👾',
                    message: "Selecciona los puntos de entrada:",
                    choices: script_type[answer.type]['entry_points'].map(el => { return { name: el } }),
                    validate: (value) => {
                        if (!value.length) return 'Tienes que tener un entry point baboso 🙊';
                        return true;
                    }
                }
            ]).then((answer) => {
                script['entry_points'] = answer.entrypoint.concat([' ']);
                inquirer.prompt([
                    {
                        type: 'input',
                        name: 'name',
                        prefix: '👾',
                        message: 'Nombre del script:',
                        validate: (value) => {
                            if (!value.match(/^[a-z]{3}_(ue|cs|mr|rl|sl|sc)_([a-z]{1,})\.js$/)) return 'El nombre del archivo no tiene el formato correcto baboso 🙊';
                            return true;
                        },
                    },
                    {
                        type: 'input',
                        name: 'description',
                        prefix: '👾',
                        message: 'Agrega una descripción al script:',
                        validate: (value) => {
                            if (value.length < 50) return 'La descripción debe tener al menos 50 caracteres';
                            return true;
                        },
                    },
                    {
                        type: 'confirm',
                        name: 'scriptrecord',
                        message: 'Agregar script record',
                    }
                ]).then((answer) => {
                    script['author'] = config.author;
                    script['author_email'] = config.email;
                    script['root'] = config.name;
                    script['name'] = answer.name;
                    script['description'] = answer.description;
                    script['scriptrecord'] = answer.name.replace(/(_)/g, '|').replace(/\.js/, '').toUpperCase();
                    script['id'] = answer.name.replace(/([a-z]{3}_(ue|cs|mr|rl|sl|sc)_|\.js)/g, '').substr(0, 28);

                    let template_script = fs.readFileSync(_routes.template, 'utf8');
                    template_script = template_script.replace('{author}', script.author)
                        .replace('{author_email}', script.author_email)
                        .replace('{script_name}', script.name)
                        .replace('{description}', script.description)
                        .replace('{script_type}', script.type)
                        .replace('{entry_point}', script.entry_points.join(': null,\n\t'));

                    fs.writeFile(path.join(_routes.cwd, 'FileCabinet', (apptype == 'SUITEAPP') ? 'SuiteApps' : 'SuiteScripts', config.name, script.name), template_script, 'utf8', (err) => { });
                    if (answer.scriptrecord) {
                        inquirer.prompt([
                            {
                                type: 'checkbox',
                                name: 'record',
                                prefix: '👾',
                                message: "El record script aplicará para:",
                                choices: JSON.parse(fs.readFileSync(_routes.record, 'utf8')).concat([new inquirer.Separator()]),
                                validate: (value) => {
                                    if (!value.length) return 'El valor es obligatorio baboso 🙊';
                                    return true;
                                }
                            }
                        ]).then((answer) => {
                            console.log(answer);
                            let template_record = fs.readFileSync(path.join(_routes.objects, `${script.record}.xml`), 'utf8');
                            let template_deploy = fs.readFileSync(path.join(_routes.objects, 'scriptdeployment.xml'), 'utf8');
                            switch (script.record) {
                                case 'client':
                                case 'userevent':
                                    {
                                        let template = answer.record.map((el, index) => {
                                            let appliesto = (el !== 'CUSTOMRECORD') ? `<recordtype>${el}</recordtype>` : '<recordtype>[scriptid=]</recordtype>';
                                            let result = template_deploy
                                                .replace('{deploy}', `${script.id}_${++index}`)
                                                .replace('{recordtype}', appliesto)
                                                .replace('{env}', config.env.toUpperCase())
                                                .replace('{title}', '');
                                            return result;
                                        });
                                        template = template.join('\n');
                                        template_record = template_record.replace('{scriptdeployment}', template)
                                    }
                                    break;
                                default:
                                    break;
                            }
                            template_record = template_record
                                .replace('{name}', script.scriptrecord)
                                .replace('{scriptid}', script.id)
                                .replace('{description}', script.description)
                                .replace('{path}', `/${(apptype == 'SUITEAPP') ? 'SuiteApps' : 'SuiteScripts'}/${config.name}/${script.name}`);

                            if (!fs.existsSync(path.join(_routes.cwd, 'Objects', 'customscript'))) fs.mkdirSync(path.join(_routes.cwd, 'Objects', 'customscript'));
                            fs.writeFile(path.join(_routes.cwd, 'Objects', 'customscript', `customscript_${script.id}.xml`), template_record, 'utf8', (err) => { });
                        });
                    }
                });
            });
        });
    }
}
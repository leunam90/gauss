/**
 * Module to create a new SDF project
 */
const util = require('util');
const path = require('path');
const fs = require('fs');
const inquirer = require('inquirer');
const _routes = require('../routes');
const { spawn, exec } = require('child_process');
let execp = util.promisify(exec);

module.exports = {
        suiteapp: async(project) => {
                try {
                    let { stdout, stderr } = await execp(path.join(_routes.sdfcli, `suitecloud createproject -type ${project.type} -parentdirectory ${_routes.cwd} -projectname ${project.name} -projectid ${project.projectid} -publisherid ${project.publisherid} -projectversion ${project.projectversion}`));
                    if (stdout.match(/.+ has been created/)) {
                        //when the suiteapp is created then modify the manifest to add default features
                        const manifest = `<manifest projecttype="${project.type}">
    <!--<publisherid>${project.publisherid}</publisherid>-->
    <!--<projectid>${project.projectid}</projectid>-->
    <projectname>${project.name}</projectname>
    <!--<projectversion>${project.projectversion}</projectversion>-->
    <frameworkversion>1.0</frameworkversion>
    <dependencies>
        <features>
${['SERVERSIDESCRIPTING', 'CUSTOMRECORDS', 'CRM'].map(el => `\t\t<feature required="false">${el}</feature>`).join('\n')}
        </features>
    </dependencies>
</manifest>`
                //deletes default manifest for create a our sutom manifest
                const project_dir = (project.type == 'SUITEAPP') ? `${project.publisherid}.${project.projectid}` : project.name;
                fs.unlinkSync(path.join(_routes.cwd, `${project_dir}`, 'manifest.xml'))
                fs.writeFile(path.join(_routes.cwd, `${project_dir}`, 'manifest.xml'), manifest, (err) => { });
                //print stdout of sdfcli createproject
                console.log(stdout);

                //into project directory initialize a new git repository
                process.chdir(path.join(_routes.cwd, `${project_dir}`));
                try {
                    let { stdout, stderr } = await execp('git init');
                    if (stdout.match(/Initialized empty Git repository .+/)) {
                        //creates new .gitignore file
                        fs.writeFile(path.join('.', '.gitignore'), 'error.log\nnode_modules\npackage-lock.json\n.vscode', (err) => { });
                        //print stdout of git init
                        console.log(stdout);

                        inquirer.prompt({
                            type: 'confirm',
                            name: 'tracking',
                            message: "Quieres agregar el traking a un remoto",
                        }).then((answers) => {
                            if (!answers.tracking) return;
                            //the user want add a new remote traking 
                            inquirer.prompt({
                                type: 'input',
                                name: 'remote_url',
                                message: "Cuál es la URL del remoto a segur",
                                validate: (value) => {
                                    if (!value) return 'La url no puede ser una cadena vacia';
                                    return true;
                                }
                            }).then((answers) => {
                                execp(`git remote add origin ${answers.remote_url}`, (stdout, stderr, error) => { console.log('Se ha agregado el remoto!') });
                            });
                        }).finally(() => {
                            //creates the package.json in main directory project
                            inquirer.prompt({
                                type: 'input',
                                name: 'abbreviation_company',
                                message: "¿Cuál es abreviación de la compañia?",
                                validate: (value) => {
                                    if (value.length != 3) return 'Tamaño no válido';
                                    return true;
                                }
                            }).then((answer) => {
                                const config = {
                                    "name": project_dir,
                                    "author": "",
                                    "email": "",
                                    "authid": "",
                                    "role": 55,
                                    "url": "system.netsuite.com",
                                    "version": `${project.projectversion}`,
                                    "env": "testing",
                                    "description": "",
                                    "company_abbreviation": answer.abbreviation_company
                                }
                                fs.writeFile(path.join('.', 'config.json'), JSON.stringify(config, null, 4), 'utf8', (err) => { });
                                if (project.type === 'ACCOUNTCUSTOMIZATION') fs.mkdirSync(path.join(_routes.cwd, project.name, 'FileCabinet', 'SuiteScripts', project.name));
                            });
                        });
                    }
                } catch (e) {
                    console.error(e.stderr); // should contain code (exit code) and signal (that caused the termination).
                }
            }
        } catch (e) {
            console.error(e.stderr); // should contain code (exit code) and signal (that caused the termination).
        }
    },
    customapp: () => {
        //TODO ejecutar comando para crear ACCOUNTCUSTOMIZATION 
    }

}
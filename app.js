#!/usr/bin/env node
const minimist = require('minimist');
const inquirer = require('inquirer');
const _routes = require('./routes');
const fs = require('fs');
const path = require('path');

const args = minimist(process.argv.slice(2), {
    alias: {
        c: 'create-project',
        a: 'add-account',
        t: 'access',
        s: 'script',
        u: 'upload',
        d: 'deploy'
    }
});

if (args['create-project']) {
    if (typeof args['create-project'] !== 'string') {
        console.error('El comando requiere el nombre del proyecto a crear');
    } else {
        const create = require('./commands/createproject');
        const project = {
            name: args['create-project'].toLowerCase(),
            type: 'ACCOUNTCUSTOMIZATION',
            projectid: `beexp${args['create-project'].toLowerCase()}`,
            publisherid: 'com.beexponential',
            projectversion: '1.0.0'
        }
        create.suiteapp(project)
    }
}

if (args['add-account']) {
    if (typeof args['add-account'] !== 'boolean') {
        console.log('El comando no requiere parametros adicionales')
    } else {
        if (fs.existsSync(path.join(_routes.cwd, 'manifest.xml'))) {
            const account = require('./commands/account');
            account.issuetoken();
        } else {
            console.log('El comando debe ejecutarse en un proyecto sdf no seas baboso, hiciste un joses 😑😑😑😑')
        }
    }
}

if (args['access']) {
    if (typeof args['access'] !== 'boolean') {
        console.log('El comando no requiere parametros adicionales')
    } else {
        if (fs.existsSync(path.join(_routes.cwd, 'manifest.xml'))) {
            const account = require('./commands/account');
            account.authenticate();
        } else {
            console.log('El comando debe ejecutarse en un proyecto sdf no seas baboso, hiciste un joses 😑😑😑😑')
        }
    }
}

if (args['script']) {
    if (typeof args['script'] !== 'boolean') {
        console.log('El comando no requiere parametros adicionales')
    } else {
        if (fs.existsSync(path.join(_routes.cwd, 'manifest.xml'))) {
            const scripts = require('./commands/scripts');
            scripts.create();
        } else {
            console.log('El comando debe ejecutarse en un proyecto sdf no seas baboso, hiciste un joses 😑😑😑😑')
        }
    }
}

if (args['upload']) {
    if (typeof args['upload'] !== 'string') {
        console.log('El comando requiere la ruta del arichivo desde el FileCabinet')
    } else {
        if (fs.existsSync(path.join(_routes.cwd, 'manifest.xml'))) {
            const scripts = require('./commands/scripts');
            scripts.upload(args['upload']);
        } else {
            console.log('El comando debe ejecutarse en un proyecto sdf no seas baboso, hiciste un joses 😑😑😑😑')
        }
    }
}

if (args['deploy']) {
    if (typeof args['deploy'] !== 'boolean') {
        console.log('El comando no requiere parametros adicionales')
    } else {
        if (fs.existsSync(path.join(_routes.cwd, 'manifest.xml'))) {
            const scripts = require('./commands/scripts');
            scripts.deploy();
        } else {
            console.log('El comando debe ejecutarse en un proyecto sdf no seas baboso, hiciste un joses 😑😑😑😑')
        }
    }
}
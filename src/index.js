const pkg = require('../package')
const path = require('path')
const commander = require('commander')
const Cli = require('./class/cli')

function createCommander(program,cli) {
    program.configureHelp({
      sortSubcommands: true,
      subcommandTerm: (cmd) => cmd.name()
    })

    program.name(pkg.name)

    program.version(pkg.version, '-v, --version', 'output the current version')

    program.command('create <name>')
        .description('create a new task')
        .option('-j, --job <value>', 'choose a job, default with a empty job')
        .action(cli.getMethod('createTask'))

    program.command('delete <name>')
        .description('delete a task')
        .action(cli.getMethod('deleteTask'))

    program.command('run <name>')
        .description('run a task')
        .option('-e, --export', 'export data only')
        .option('-t, --test', 'custom test only')
        .option('-d, --daemon', 'run with daemon mode')
        .option('-c, --custom','run custom code after the task finished')
        .action(cli.getMethod('runTask'))

    program.command('stop <name>')
        .description('stop a task')
        .option('-r, --restart', 'stop and restart task')
        .action(cli.getMethod('stopTask'))

    program.command('reset <name>')
        .description('reset a task')
        .option('--hard', 'delete all data of task')
        .action(cli.getMethod('resetTask'))

    program.command('list')
        .description('list task info')
        .option('-t, --type <value>', 'show list info about task')
        .action(cli.getMethod('listInfo'))

    program.command('config [name]')
        .description('set global or task config or custom code')
        .option('-s, --set <key=value>', 'set config')
        .option('-c, --custom', 'edit custom exec code')
        .option('-o, --overwrite', 'edit overwrite code of task')
        .option('-e, --export-data', 'edit custom export data code')
        .action(cli.getMethod('setConfig'))

    program.command('server')
        .description('launch a api server')
        .option('-H, --host', 'server address, default use 127.0.0.1')
        .option('-p, --port', 'server port, default use 7000')
        .option('-d, --daemon', 'run with daemon')
        .action(cli.getMethod('server'))
}

async function main(cli){
    const program = new commander.Command()
    createCommander(program,cli)
    await program.parseAsync(process.argv)
}

module.exports = async () => {
    if(!await Cli.installCheck()) {
        process.exit(1)
    }

    let cli = Cli.getInstance()

    if(!cli) process.exit(1)

    try {
        await main(cli)
    } catch (e) {
        if(cli.getEnv('COPHA_DEBUG')){
            console.log(e)
        }else{
            cli.log.err(e)
        }
    }
}

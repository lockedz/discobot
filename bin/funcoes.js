// Nesse caso, o que adianta eu ter um CONFIG se "tenho" que usar o path hardcoded aqui??? FIXME
//const CONFIG =  require('../config/config');
const Discord = require('discord.js');
const fs =      require('fs');
const UTIL =    require('../bin/util');
const weather = require('weather-js');
const fetch =   require('node-fetch');

module.exports = {
    cmd_help: function(message, HELP_LISTA, TAM_PREFIX) {
        let isTooBig = false;
		let totalCommands = Object.keys(HELP_LISTA).length;
        const embedHelp = new Discord.RichEmbed()
			.setColor('#bb30db')
			.setTitle('Lista de comandos\n\n')
			.setDescription('Todos os comandos devem ser utilizados com um prefixo de tamanho '+UTIL.normalizeDigits(TAM_PREFIX));
        Object.keys(HELP_LISTA).forEach((key, idx) => {
            // key: the name of the object key
            // idx: the ordinal position of the key within the object
            // console.log(`vejamos key = ${key} e indice = ${idx} e conteudo = ${HELP_LISTA[key]}`);
            if (!isTooBig) {
                embedHelp
                    .addField(`${key}`, `${HELP_LISTA[key]}`);
                if (idx === 24) { // 24, aparentemente, é o máximo de campos embed que podemos ter
                    isTooBig = true;
                    embedHelp.setFooter(`\n*... ainda existem mais ${UTIL.normalizeDigits(totalCommands-24)} comandos`);
                }
            }
        });
        if (!isTooBig)	embedHelp.setFooter(`\n${UTIL.normalizeDigits(totalCommands)} comandos listados`);
        message.channel.send(embedHelp);
		
		return;
    },
    cmd_howTo: function(message, args) {
        if (args.length === 0 || args.length !== 0) { // Change when there is more howto's to add...
            message.channel.send(`\`\`\`To use block codes on Discord, put three 'ticks' (\`) together, then the name of the language (without space) you want to highlight (or none) then the code & finally, finish with three more ticks and hit enter **after** the ticks. Done!\`\`\``);
        }
    },
    cmd_sleep: function(message, args, DEFAULT_TEMPO_DND, BOT, botStatus, timeoutHandler) {
        let tempoDND; // tempo em MINUTOS
    
        if (args.length === 1 && !isNaN(args[0]) && args[0] >= 0 && args[0] <= 1024) {
            tempoDND = (args[0] * 1000 * 60);
        } else if (args.length === 0) {
            tempoDND = DEFAULT_TEMPO_DND; // 5 minutos (DEFAULT)
        }
    
        // Reseta variável, muda status no Discrod
        UTIL.setStatusBOT('dnd', BOT, botStatus);
        // Depois de tempoDND minutos, retorna ao status responsivo e envia mensagem ao canal
        timeoutHandler.botHandler = setTimeout(() => {
            UTIL.backToWork(message, 'online', 'Hell yeah! *I am awake*!', BOT, botStatus, timeoutHandler);
        }, tempoDND);
        message.channel.send(`Entering *sleep mode*... waking up in: **${UTIL.normalizeDigits((tempoDND / 60000))}**min`);
        //console.log(BOT.user.settings.timerHandler); // FIXME: como eu faço um.. getStatus() ?
    },
    cmd_viver: function(message, args) {
        if (args.length === 0) return;
        else if (args.length === 1) {
            let autor = message.author;
            message.channel.send(`Pô, ${args[0]}, deixa o ${autor} viver!`);
        }
        else if (args.length >= 2) {
            message.channel.send(`Pô, ${args[0]}, deixa o ${args[1]} viver!`);
        }
		
		return;
    },
    cmd_ping: async function(message, BOT) {
        const m = await message.channel.send('Ping?');
        m.edit(`**Pong**! *${Math.round(BOT.ping)}*ms`)
        .catch(e => {console.log(e.stack)});
		
		return;
    },
    cmd_say: function(message, args) {
        const sayMessage = args.join(' ');
        message.delete().catch(O_o => {}); // Se não puder deletar a mensagem, não faz nada com o erro e continua
        message.channel.send(sayMessage);
		
		return;
    },
    cmd_8ball: function(message, args, EIGHTBALL) {
        if (args.length === 0) return;
        else message.reply(EIGHTBALL[Math.floor(Math.random() * EIGHTBALL.length)]);
		
		return;
    },
    cmd_sonho: function(message, SONHOS) {
        message.channel.send(SONHOS[Math.floor(Math.random() * SONHOS.length)]);
		
		return;
    },
    cmd_timer: function(message, args, timeoutHandler, timerGlobals) {
        let tempoDecorrido, tempoRestante;
        
        if (timeoutHandler.timerHandler) { // Se existe um timer ativo...
            tempoDecorrido = (Math.floor(Math.round((new Date()).getTime() - timerGlobals.time) / 1000));
            tempoRestante = (timerGlobals.tempo - tempoDecorrido);
        }
        if (args.length >= 2 && !isNaN(eval(args[0]))) { // USANDO "EVAL". QUALQUER PROBLEMA, RETIRAR ESSE EVAL!!
            if (!timeoutHandler.timerHandler) { // Se NÃO existe um timer ativo, vamos dar sequência à rotina
                timerGlobals.tempo = eval(args[0]);
                
                if (timerGlobals.tempo <= 0) {
                    timerGlobals.tempo = 0;
                }

                let texto = args.slice(1).join(' ');

                message.channel.send(`Timer iniciado: **${UTIL.normalizeDigits(timerGlobals.tempo)}**sec para *${texto}*`);

                timerGlobals.time = (new Date()).getTime();
                timeoutHandler.timerHandler = setTimeout(() => { message.channel.send(`**ACABOU O TEMPO PARA**: *${texto}*`); timeoutHandler.timerHandler = null; }, timerGlobals.tempo*1000);
            } else {
                message.channel.send('Já existe um timer rodando. (ativo há **' + UTIL.normalizeDigits(tempoDecorrido) + '**sec) (faltando: **'+ UTIL.normalizeDigits(tempoRestante) +'**sec)');
            }
        } else if (args.length === 1 && args[0].toLowerCase() === 'off') {
            if (timeoutHandler.timerHandler) {
                message.channel.send(`Timer **CANCELADO**. Restavam **${UTIL.normalizeDigits(tempoRestante)}**sec`);
                clearTimeout(timeoutHandler.timerHandler);

                timeoutHandler.timerHandler = null;
                timerGlobals.time = tempoRestante = tempoDecorrido = 0;
            } else {
                message.channel.send(`Não há nenhum timer ativo.`);
            }
        } else if (args.length === 1 && args[0].toLowerCase() === 'check') {
            if (timeoutHandler.timerHandler) {
                message.channel.send('Tempo decorrido no timer: **' + UTIL.normalizeDigits(tempoDecorrido) + '**sec. Restam: **' + UTIL.normalizeDigits(tempoRestante) + '**sec');
            }
        }
    },
    cmd_uptime: function(message) {
        let tempoTotalUptime = process.uptime(); // em segundos
        let mins, secs, horas;
        let announceString = ``;

        tempoTotalUptime = Math.round(tempoTotalUptime);
        horas = ~~(tempoTotalUptime / 3600);
        mins = ~~(tempoTotalUptime / 60);
        secs = tempoTotalUptime % 60;

        if (tempoTotalUptime > 60) {
            if (mins >= 60) {
                // horas = ~~(mins / 60);
                //while (mins > 60) { mins = mins % horas; console.log(`mins = ${mins}`); } // Ajustar os minutos depois de calcular as horas
                //mins = ~~(horas / 60);
                mins = mins % 60;
                announceString = `Online since ${UTIL.normalizeDigits(horas)}_h_ ${UTIL.normalizeDigits(mins)}_m_ ${UTIL.normalizeDigits(secs)}_s_`;
            } else {
                announceString = `Online since ${UTIL.normalizeDigits(mins)}_m_ ${UTIL.normalizeDigits(secs)}_s_`;
            }
        } else {
            announceString = `Online since ${UTIL.normalizeDigits(tempoTotalUptime)}_s_`;
        }

        message.channel.send(announceString).catch(erro => {
            console.log(`Erro [${erro.stack}] on uptime`);
        });
        // output: console
        let timeRightNow = new Date().toLocaleTimeString();
        console.log(`[${timeRightNow}] !uptime: ${announceString.replace(/\_|\*|\~/g,'')}`);
		
		return;
    },
    cmd_version: function(message, BOT_VERSION) {
        message.channel.send(`[discobot] v${BOT_VERSION}`).catch(e => {console.log(`Could not send message [version]`)});
		
		return;
    },
    cmd_send: function(message, args) {
        let file, id_emoji;
    
        if (args[0] !== undefined) {
            file = args.join(' ').replace(/["']/g, "").toString();
        }
        else { // Mandar nada (sem argumentos) sai da função
			return;
        }
    
        // Envia o arquivo no canal atual
        message.channel.send({
            files: [{
                attachment: file,
                name: file
            }]
        })
        .then(() => {
            id_emoji = '🆗';
            message.react(id_emoji).catch(e => {console.log('Could not react! [send file/sucesso]')});
        })
        .catch((e) => {
            console.error;
            //message.channel.send(`O arquivo ** ${file} ** não existe.`); // to send a message to the channel as well as reacting seems overkill
            id_emoji = '❓';
            message.react(id_emoji).catch(e => {console.log('Could not react! [send file/não encontrado]')});
        });
    },
    cmd_coinflip: function(message, args) {
        if (args.length < 3) return;
        
        let separador = '|'; // default: |
        
        let index = args.findIndex((idx) => {return idx === separador});
        if (index === -1) return;
        // Considerar utilizar - ou não - trim()
        let firstValue = args.slice(0, index).join(' ').trim();
        let lastValue = args.slice(index+1).join(' ').trim();
        let theChoosenOne = (Math.floor(Math.random() * 2) === 0) ? firstValue : lastValue;

        message.channel.send(`** ${theChoosenOne} **`);
        return;
    },
    cmd_exp: (message, args, _path, eXp) => {
        // Retorna a exp de quem digitou OU - caso exista - do argumento
        let expRead;
        let target = ((args[0]) ? args[0] : message.author);
        let targetStripped = target.toString().replace(/\<|\>|\!/g, '');
        let _fullpath = _path + '/' + targetStripped + '.exp';

        if (!fs.existsSync(_fullpath)) {
            message.channel.send(`Usuário ${target} não possui experiência.`);
            return;
        }

        /* fs.readFile(_fullpath, 'utf8', async (err, data) => {
            if (err) throw err;

            expRead = await data;
            await message.channel.send(`${target} possui _${expRead}exp_.`);
            return;
        }); */
        expRead = fs.readFileSync(_fullpath, 'utf8');
        message.channel.send(`${target} possui _${expRead}exp_. [+${eXp.up}]`);
        
        return;
    },
    cmd_eval: (message, args) => {
        if (args.length <= 0) return;
        if (message.author.id !== '375474036022575104' && message.author.id !== '717369666137358367') {
			message.react('⛔').catch(e => {console.log('could not react with emoji: [eval area] '+e)});
			return; // se não for EU (lockedz), não execute
		}

        let calc;
		let argsFormatted = args.join(' ');
        // EXPLOITABLE: posso passar objetos do Discord pelo eval()
        try {
            calc = eval(args.join(' '));
        } catch(e) {
            console.log(`-- Erro no argumento de !eval: ${e}`);
			return message.channel.send(`Error in the argument list: ${argsFormatted}`);
        }
        return;
        //return message.channel.send(`${argsFormatted} = ${calc}`).catch(err => {console.error(`Erro eval: ${err}`)});
    },
    cmd_start: (message, args, timeoutHandler) => {
    // Fazer um "start" e um "stop" pra "!start algo" começa um timer para 'algo', mas o timer é incremental e só para com um CONST_LIMITE_TIMER ou ao mandarem o comando "!stop"
        // Isso era pra ser um timer INCREMENTAL, eu fiz a mesma funcionalidade que timeout...
        if (args.length < 1 || isNaN(parseInt(args[0]))) return;

        let timeout = {
            tempo:      args[0],
            subject:    (args.length >= 2) ? args.slice(1).join(' ') : ''
        };
        let subjectAdjusted = (timeout.subject === '') ? '' : ': '+timeout.subject;

        timeoutHandler.startCommand = setTimeout(() => { message.channel.send(`**TIMEOUT**${subjectAdjusted}`); }, timeout.tempo*1000);
        message.channel.send(`Timer iniciado: ${UTIL.normalizeDigits(timeout.tempo)} segundos*${subjectAdjusted}*`);
    },
    cmd_stop: (message, timeoutHandler) => {
        if (timeoutHandler.startCommand) {
            clearTimeout(timeoutHandler.startCommand);
            timeoutHandler.startCommand = null;

            message.channel.send(`Timer **cancelado**`);
        } else {
            message.channel.send(`Não há nenhum timer ativo para ser cancelado.`);
        }
    },
    cmd_mirror: (message, args, mirrorUser) => {
        if (args.length < 1 || args.length > 2 || typeof mirrorUser === 'undefined' || mirrorUser === {}) return;

        let iWhichArg = (args.length > 1 ? 1 : 0);

        if (args[iWhichArg] === '-off') {
            mirrorUser.id = null;
            mirrorUser.status = false;
            mirrorUser.style = null;
            mirrorUser.name = null;

            return;
        } else if (!mirrorUser.status) { // se não existir nenhum mirror ativo E tiver argumento [0] & usuario [1]
            mirrorUser.style = (iWhichArg === 1 ? args[iWhichArg-1].substring(1, args[iWhichArg-1].length) : 'default');
        }

        //console.log(message.guild.member(message.mentions.users.first()).id); console.log(message.guild.members.get(args[0]));
        let lookForUser = message.guild.member(message.mentions.users.first()) || message.guild.members.get(args[iWhichArg]);
        if (!lookForUser) { return; }
        
        mirrorUser.id = lookForUser.id;
        mirrorUser.name = lookForUser.user.username;
        mirrorUser.status = true;

        message.channel.send(`I'll be mirroing **${mirrorUser.name}** (_${mirrorUser.style}_). To stop me from doing so, type: '!mirror -off'`);
        console.log(`-- Mirroing = ${mirrorUser.id} (${lookForUser.user.username})`);

        return;
    },
    cmd_memo: (message, args, MEMO) => {
        if (args.length < 1) {
            if (MEMO.content !== null) { // Se existe algum MEMO ativo
                message.channel.send(`[MEMO] by ${MEMO.byUser} [${MEMO.date}]:\n **${MEMO.content}**`);
            } else {
				message.channel.send(`_No memo at the moment..._`);
			}
            return;
        }

        if (args[0] === '-del') {
            MEMO.content = null;
            MEMO.date = null;

            let id_emoji = '🆗';
            message.react(id_emoji).catch(e => {console.log('Could not react! [memo delete]: '+e)});
            return;
        } else {
            if (MEMO.content != null) return;
            
            MEMO.byUser = message.author;
            MEMO.content = args.join(' ');
            MEMO.date = UTIL.fullDate() + ' ' + new Date().toLocaleTimeString();

            message.channel.send(`_MEMO adicionado_`);
        }

        return;
    },
    cmd_clima: (message, args) => {
        // Código copy-pasted (por preguiça) de https://www.youtube.com/watch?v=kQMKkg1aNaE
        // Package: weather-js
        let unidadeGraus = 'C';
        let argsAsString = args.join(' ');

        weather.find({search: argsAsString, degreeType: unidadeGraus},
                function(err, result) {
                    if (err) console.log(err);

                    if (result.length === 0) {
                        message.channel.send('Localização inválida.');
                        return;
                    }

                    // Variables
                    let current = result[0].current;
                    let location = result[0].location;

                    const embed = new Discord.RichEmbed()
                        .setDescription(`**${current.skytext}**`)
                        .setAuthor(`Weather for ${current.observationpoint}`)
                        .setThumbnail(current.imageUrl)
                        .setColor(0x00AE86)
                        .addField('Timezone',`UTC ${location.timezone}`, true)
                        .addField('Observation time', `${current.observationtime}`, true)
                        .addField('Temperature',`${current.temperature} ${unidadeGraus}`, true)
                        .addField('Feels like', `${current.feelslike} ${unidadeGraus}`, true)
                        .addField('Winds', `${current.winddisplay}`, true)
                        .addField('Humidity', `${current.humidity}%`, true)

                        message.channel.send({embed});
                }
        );
    },
    cmd_randomFact: async (message) => { // Needs to be above cmd_antiIdleToggle because of the function type declartion...
        const file = await fetch('https://uselessfacts.jsph.pl/random.json?language=en').then(response => response.json()).catch(e => {console.log('Could not fetch randomfact: '+e)});

	    message.channel.send(`${file.text} - _source: ${file.source}_`);
    },
	cmd_antiIdleToggle: (message, botMandaMensagensAntiIdle, idleTime, timeoutHandler) => { // FIXME: Colocar no index.js ?
		botMandaMensagensAntiIdle.flag = !botMandaMensagensAntiIdle.flag; // por ser um Object, a referência é atualizada "globalmente"
		let boolStr = UTIL.boolToText(botMandaMensagensAntiIdle.flag, 'en'); // Transforma de true para 'sim' e de false para 'não'
		
		message.channel.send(`Bzz! Sending random facts: **${boolStr}** every **${idleTime}** minutes!`);

        if (timeoutHandler.intervalCheck === null && botMandaMensagensAntiIdle.flag) {
            timeoutHandler.intervalCheck = setInterval(() => {
                if (botMandaMensagensAntiIdle.flag) {
                    cmd_randomFact(message);
                }
            }, ((idleTime === null) ? INTERVAL_SERVER_MESSAGES : idleTime) * 60000); // tempo ajustado para MINUTOS
        } else {
            timeoutHandler.intervalCheck = null;
        }
    },
    cmd_cool: (message, args) => {
        let LIMITE_MAXIMO_CARACTERES = 10;
        let possuiSenha = false;

        if (args.toString().substring(0,3) === 'pei') possuiSenha = true; // Só para não crashar o bot caso seja uma mensagem muito longa (se nao tiver "senha", so pra testes)

        let str_acumulador = str_completa = str_args = '';
        let tam_total_mensagem = 0;
        str_args = args.join(' ');
        if (possuiSenha) {
            str_args = str_args.slice(3);
            LIMITE_MAXIMO_CARACTERES = 1024;
        }

        tam_total_mensagem = str_args.length || 0;

        if (tam_total_mensagem === 0 || tam_total_mensagem > LIMITE_MAXIMO_CARACTERES) return;

        for (let i = 0; i < tam_total_mensagem; i++) {
            str_acumulador += str_args.charAt(i);
            str_completa += str_acumulador + '\n';
        }

        message.channel.send('\u200B\n' + str_completa);
    },
    cmd_tree: (message, args) => {
		const EVEN_MAX = 34; // Se tiver mais de 34 o tamanho total da mensagem excede 2000caracteres
        let zeroWidth = '\u200B';
        //let isOdd = false;
        let hasOption = false; 
        let completeString = completeStringAdjusted = acumulatorString = argsAsString = '';
        let argsStringSize = initialSpaces = howManyLevels = charPos = 0;

        if (args.length > 0) {
            argsAsString = args.join(' ');
            if (argsAsString.substring(0, 5) === '-mono') { // Se tiver a opção; se usa como !tree -mono [args] ou !tree [args]
                hasOption = true;
                argsAsString = argsAsString.slice(6); // Ajusta para retirar o '-mono ' do texto
            }
            argsStringSize = argsAsString.length;
            
            if (argsStringSize % 2 !== 0) {
                isOdd = true;
            } else {
                isOdd = false;
            }
        } else { 
            return; // Se não houver argumentos NÃO faz nada
        }

        if (isOdd) {
            initialSpaces = Math.floor(argsStringSize / 2);
            howManyLevels = Math.ceil(argsStringSize / 2);

            for (let i = 1; i <= howManyLevels; i++) {
                acumulatorString = ' '.repeat(initialSpaces) + '' + argsAsString.substring(0, charPos+1);
                completeString += acumulatorString + '\n';
                charPos += 2;
                initialSpaces -= 1;
            }
        } else { // by Cho
			if (argsStringSize > EVEN_MAX) {
				message.channel.send(`A mensagem iria exceder 2000 caracteres, no can do it.`);
				return;
			} // Se exceder o tamanho máximo
		
            initialSpaces = argsStringSize;
    
            for (let i = 1; i <= argsStringSize; i++) {
                acumulatorString = ' '.repeat(initialSpaces);
                
                for (let j = 0; j <= charPos; j++) {
                    acumulatorString += argsAsString.substring(j, j + 1);
                    if (j < charPos) acumulatorString += ' ';
                }
                
                completeString += acumulatorString + '\n';
                charPos++;
                initialSpaces--;
            }
        }

        completeStringAdjusted = (hasOption ? '\`\`\`'+ completeString + '\`\`\`' : zeroWidth + '\n' + completeString);
		
		// Equacao (FIXME) que calcula o tamanho de caracteres dada N = Entrada.length
		let O = function(n) {
			return n*n + n*n/2 + n*2-1;
		}
		let tamanhoCalculado = O(argsStringSize);
		
		message.channel.send(`${completeStringAdjusted}`);
        //message.channel.send(`${completeStringAdjusted} tamanho: ${completeStringAdjusted.length} | tamanho calculado: ${ababua}`);
    },
    cmd_mktree: (message, args) => { // !mktree tamanho_da_tree <EMOJI>
        // FIXME: Emojis não ficam formatados corretamente, se <EMOJI> for apenas um char qualquer, a saída é formatada ok
        if (args.length !== 2) return;

        let acumulatorString = completeString = adjustedCompleteString = '';
        let howManyLevels = parseInt(args[0]) || 1;
        let initialSpaces = parseInt(howManyLevels+1) || 1;
        let emojiID = args[1];

        for (let i = 1; i <= howManyLevels; i++) {
            acumulatorString = ' '.repeat(initialSpaces);
            for (let j = 1; j <= i; j++) {
                acumulatorString += emojiID + ' ';
            }
            completeString += acumulatorString.slice(0, -1) + '\n'; // slice usado para retirar o último espaço de cada linha
            initialSpaces -= 1;
        }

        adjustedCompleteString = '\`\`\`' + completeString + '\`\`\`';
        message.channel.send(`${adjustedCompleteString}`);
        //console.log(adjustedCompleteString);
    }
    // cmd_testOne: (message, args) => { // TODO DRUNK
    //     const VEZES = 4;
    //     let m, timerPica;

    //     m = await message.channel.send('8==D');

    //     timerPica = window.setTimeout(() => (message.channel.send('8===D')), 3000);
    //     m.edit(`${timerPica}`)

    //     return;
    // }
};
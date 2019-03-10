const Discord =         require('discord.js');
const fs =              require('fs');
const CONFIG =          require('./config/config');
const TOKEN =           require(CONFIG.dir.token);
const HELP_LISTA =      require(CONFIG.dir.help);
const RESPONSE_OBJECT = require(CONFIG.dir.respostas); // Deixar todo elemento[0] da tupla em lowercase e sem espaços
const BOT_REPLY_MENTION = require(CONFIG.dir.replies);
const UTIL =            require(CONFIG.dir.util);
const FUNCOES =         require(CONFIG.dir.funcoes);

const BOT =             new Discord.Client();

const BOT_VERSION =     CONFIG.about.version; // atualizado 10/09/2018
const TAM_PREFIX =      parseInt(CONFIG.preference.tamanho_prefixo); // TAMANHO DO 'CHAR' DE PREFIXO PARA COMANDOS (1: '!' OU '+')
const DESCANSO =        parseInt(CONFIG.preference.intervalo_inativo); // TEMPO, EM MILESEGUNDOS, PARA O BOT FICAR SEM RESPONDER (EVITA SPAM DE COMANDOS)
const DEFAULT_TEMPO_DND = CONFIG.preference.tempo_sleep;
const pathFile = CONFIG.dir.log.logdir+'/'+CONFIG.dir.log.logfile; // FIXME: se o BOT for iniciado de outro local (ex: pelo .bat no desktop), o log.txt é criado no desktop

// TODO: ON ERROR DEVE RESETAR TUDO PARA UM ESTADO INICIAL;
// Resetar todas as variáveis na mão? Se eu fizer uma função init() não preciso explicitar a inicialização das variáveis aqui no começo... vale a pena?

const EIGHTBALL = ['sim','não','talvez','não me importo','fuckriuuuu','what?','hell yeah','hoje, amanhã e sempre','...','pode ser que sim, pode ser que não',
    'com certeza','nunca','jamais','sempre', 'só sei que nada sei', 'pang la sia peipei', 'a resposta é 42', 'vai estudar, desgraça', 'as estrelas apontam para o sim', 'vou pensar depois te digo'];

const SONHOS = [

];
const INTERVAL_SERVER_MESSAGES = parseInt(CONFIG.preference.tempo_interval_check) || 1; // Tempo em minutos para ficar mandando mensagem para um canal em especifico, evitando canal idle
const IDLE_MESSAGES_OBJECT = require(CONFIG.dir.idle_messages);

let intervalCheckCounter = 0;
let botMandaMensagensAntiIdle = {flag: false};
let allowDelete = {flag: true};
let inutil = {handler: null, status: null};
let eXp = {up:0};
let timerGlobals = {time: 0, tempo: 0}; // Utilizado em cmd_timer()
let timeoutHandler = {timerHandler:null, botHandler: null, startCommand: null, intervalCheck: null}; // instanciado como objeto pra poder ser passado por referência para(s) a(s) função(ões)
let botStatus = {status:'online'}; // obj (passa-se por referência)
let mirrorUser = {id:null, status:false, style: null}; // id do usuário na guild | status se está on [o mirror] (true) ou não (false) | style qual estilo (função) pro texto
let MEMO = {byUser: null, content:null, date:null};


/* *****************
* COMEÇO DO CÓDIGO *
********************/
// TODO: onde tiver hardcoded meu nick, fazer com que seja por "roles" ?
// Fazer com que o !antiidle aceite um parâmetro que seja o canal a mandar as mensagens

BOT.on('ready', async () => {
    const timestampInicio = new Date().toLocaleTimeString();
    console.log(`[${timestampInicio}] ${BOT.user.username} reporting for duty, bro [servers: ${BOT.guilds.size}]`);
	
	//console.log(JSON.stringify(BOT.guilds.get('375474831526985738'), null, 4));
	// FIXME: Por enquanto isso será hardcoded para o server 'feelsgoodman'. No futuro, colocar o id ou nome do server a fazer isso
	// no config
		
    // *****
    // ATENÇÃO: ESSE INTERVAL VAI FICAR RODANDO **SEMPRE** COM INTERVAL_SERVER_MESSAGES MINUTOS
    // MELHOR FORMA DE PENSAR NISSO É O BOT "CHECANDO STATUS DE QUALQUER COISA A CADA X MINUTOS" E FAZER AÇÕES (CASO NECESSÁRIO) DE ACORDO
    // *****
    timeoutHandler.intervalCheck = setInterval(() => {
        if (botMandaMensagensAntiIdle.flag) {
            let feelsgoodmanChannel = BOT.guilds.get('375474831526985738').channels.get('375474831531180033');
            intervalCheckCounter++; // variável global de "controle" contando quantas vezes o interval rodou
            //feelsgoodmanChannel.send(`Bip, bop: idle número ${intervalCheckCounter} em ${INTERVAL_SERVER_MESSAGES} minutos.`);
            feelsgoodmanChannel.send(IDLE_MESSAGES_OBJECT[UTIL.pickRandomProperty(IDLE_MESSAGES_OBJECT)]);
        }
    }, (INTERVAL_SERVER_MESSAGES * 60000)); // tempo ajustado para MINUTOS

	//console.log(BOT.guilds.get('375474831526985738').channels.get('375474831531180033'));
});



// FIXME:
// QUAL A VANTAGEM DE TER UM CONFIG & MODULARIZAÇÃO SE, EM funcoes.js EU PRECISO IMPORTAR O util.js COM OUTRO CAMINHO "ABSOLUTO"?

// ******--------*********
//      TODO LIST:
// ******--------*********
// Fazer um comando "!since NICKNAME" que mostre há quanto tempo NICKNAME está online no canal

// Provavelmente ajustar o config.json pra incluir "server/guild" e "channel". Por exemplo, pra ficar escutando a mudança de status/jogo de apenas um canal e não de todos que o bot encontra-se
// talvez fazer uma 'lista' separada por, sei lá, vírgula, no proprio config pra incluir mais de um canal/guild

// As constantes que utilizam "parseInt" devem lançar erros LOGO caso não consigam ser setadas; testar isso

// No futuro, fazer O SISTEMA DE EXP com o package do mysql (mysql --save) e cada row (id, user, exp, level) e assim poder UPAR o camarada com um threshold

// Fazer um !list <DIR> onde lista os arquivos do diretorio especificado.. talvez fazer uma lista predefinida de
// diretórios que podem ser listados tipo '!list -a' lista varios DIRS que podem ser utilizados e 
// '!list C:\users\artur\desktop' iria listar todos os arquivos desse diretório pra poder usar !send arquivo
// CUIDADO, EM PASTAS COM MUITOS ARQUIVOS (TIPO DE MUSICA) VAI CAGAR PRA MANDAR AS MENSAGENS!

// Fazer o bot responder ao mudar o status de JOGO falando, ao mudar o status, quanto tempo durou a jogatina no jogo X;


// BOT.on('presenceUpdate', async (oldMember, newMember) => {
//    // if (oldMember.presence === null || newMember.presence === null) return;
// // FIXME:
// /*
// newMember as vezes volta como 'null' (quando sai de um jogo e vai pra nada)
// como ver pra qual canal mandar a mensagem? Assumir que o bot só está em um? Mesmo assim, qual propriedade retorna um/o Channel?
// Pelo jeito oldMember e newMember não são muito como pensei... não entendi ainda o sync/async desse evento
// */
// //console.log(`oldMember: ${oldMember} & newMember = ${newMember}`);
// console.log(JSON.stringify(newMember.guild.channel, null, 4));
// if (oldMember.presence.status === newMember.presence.status) { // se a mudança foi de JOGO e NÃO de presença
//     if (!newMember.presence.game.equals(null)) { // foi de 'nada' pra algum jogo
//     let aguilda = newMember;
//         aguilda.channel.send(`${newMember} COMEÇOU a jogar ${newMember.presence.game.name}`);
//     } else { // foi de algum jogo pra 'nada'
//         console.log(`${newMember} PAROU de jogar ${oldMember.presence.game.name}`);
//     }
// } else {
// console.log('caiu no else');}
// });


BOT.on('message', async (message) => {

    if (message.author.bot) return; // se msg vier de um/do BOT, sai e não faz nada

    // ACORDA O BOT COM !wakeup (hardcoded)
    if (botStatus.status !== 'online' && message.content === '!wakeup' && message.author.id === '375474036022575104') {
        console.log('* wakeup!');
        UTIL.backToWork(message, 'online', 'Hell yeah! *Acordei*!', BOT, botStatus, timeoutHandler);
    }

	// Aqui nesse IF que tudo acontece de interação com o bot
    if (isBotAlive(inutil, botStatus)) {

        const ALL_MESSAGE = message.content.split(/ +/g); // Retorna a mensagem completa, como Array
        const args = message.content.slice(TAM_PREFIX).trim().split(/ +/g); // Separa a mensagem recebida (por espaços) RETIRANDO TAM_PREFIX caracteres do início // RETIRAR O TRIM!?
        const command = args.shift().toLowerCase(); // Retorna a primeira "palavra" & ajusta o args (retirando a primeira palavra)
		const lowerCaseContent = message.content.toString().toLowerCase();
		
		// FUNÇÕES DE COMANDO (funcoes.js)
        // RESPONDE A COMANDOS (** PRIMEIRA PALAVRA ** COM UM "PREFIXO" DE TAMANHO "TAM_PREFIX" [CONFIG])
        // EX: !help            [TAM_PREFIX = 1 & PREFIXO = "!"]
        // EX: ++sonho lockedz  [TAM_PREFIX = 2 & PREFIXO = "++"]
        let isCommandUtilized = true;
        switch (command) {
            case 'help':    FUNCOES.cmd_help(message, HELP_LISTA, TAM_PREFIX); break;
            case 'sleep':   FUNCOES.cmd_sleep(message, args, DEFAULT_TEMPO_DND, BOT, botStatus, timeoutHandler); break; // FIXME: às vezes BOT não entra em DND no Discord
            case 'viver':   FUNCOES.cmd_viver(message, args); break;
            case 'ping':    FUNCOES.cmd_ping(message, BOT); break;
            case 'say':     FUNCOES.cmd_say(message, args); break;
            case '8ball':   FUNCOES.cmd_8ball(message, args, EIGHTBALL); break;
            case 'sonho':   FUNCOES.cmd_sonho(message, SONHOS); break;
            case 'timer':   FUNCOES.cmd_timer(message, args, timeoutHandler, timerGlobals); break;
            case 'uptime':  FUNCOES.cmd_uptime(message); break;
            case 'version': FUNCOES.cmd_version(message, BOT_VERSION); break;
            case 'send':    FUNCOES.cmd_send(message, args); break;
            case 'coinflip':FUNCOES.cmd_coinflip(message, args); break;
            case 'exp':     FUNCOES.cmd_exp(message, args, CONFIG.dir.exp, eXp); break; // (DEPRECATED) TODO: usar um COMANDO deve aumentar a "rate" da exp para o usuário
            // TODO: Talvez fazer um "mention" ou dar "react" aumentem a rate de exp para tal usuário, por um tempo, também
            case 'eval':    FUNCOES.cmd_eval(message, args); break;
            case 'start':   FUNCOES.cmd_start(message, args, timeoutHandler); break;
            case 'stop':    FUNCOES.cmd_stop(message, timeoutHandler); break;
            case 'mirror':  FUNCOES.cmd_mirror(message, args, mirrorUser); break;
            case 'memo':    FUNCOES.cmd_memo(message, args, MEMO); break;
            case 'clima':   FUNCOES.cmd_clima(message, args); break;
            case 'cool':    FUNCOES.cmd_cool(message, args); break; // 14/02/2019
            case 'tree':    FUNCOES.cmd_tree(message, args); break; // 15/02/2019
            case 'mktree':  FUNCOES.cmd_mktree(message, args); break; // 19/02/2019
			
			// Comandos que não se encaixam em nenhuma categoria
            case 'pikachu': pikachu(message); break;
			
			// Comandos utilitários
            case 'allowdelete': fn_allowDelete(message, allowDelete); break;    
			case 'antiidle':	FUNCOES.cmd_antiIdle(message, botMandaMensagensAntiIdle); break;

            default:
                isCommandUtilized = false;
                break;
        }
		
        // FUNÇÕES DE REACT
        // REAGE A STRINGS "STANDALONE", NÃO COMANDOS (apesar de, em teoria, poder ser tratado como um comando)
        // TEXTOS "STANDALONE" PARA REAÇÕES (diferem do RESPONSE_OBJECT porque deve ser APENAS e EXATAMENTE esse texto na linha)
        // QUALQUER CASE (os 'case' devem ser LOWERCASE aqui, mas o BOT vai analisar qualquer case no Discord)
        switch (lowerCaseContent) {
            case 'good bot':    react_emoji(message, '375482435086843904'); break; // Coloca um Reaction ao ver a standalone-message: 'good bot'
			case 'bad bot':     react_emoji(message, '375482616079581194'); break;
            case 'joa':         react_message(message, 'Kin <:bunitaum:375662423065231371>'); break; // Manda ao canal um "Kin [emoji]" ao ler "JOA"
            case 'xd':          react_message(message, 'xisdê xD'); break;
            case 'ez':			react_message(message, '<:ez:383053763776217098> Clap'); break;
            case 'cho safado':  react_message(message, 'Essa fada!'); break;
            case 'omae wa mou shindeiru': react_message(message, '_NANI_?!'); break;

            default:
                break;
        }
		
		let fatorExp = undefined;
        if (isCommandUtilized) { // IF COMMAND WAS USED
            // EXP (MAIOR AQUI, PQ É COM COMANDO)
			fatorExp = 1.5; // 50% mais exp por ter utilizado um comando
			
			// ANTI SPAM
            UTIL.ficarInutil(inutil, DESCANSO);

            // LOG
            UTIL.doLog(message, pathFile);
        } else { // NO COMMANDS UTILIZED: NORMAL USER TEXTS
            // CHECA CADA PALAVRA DA MENSAGEM (SEPARADA POR ESPAÇO) E SE DER MATCH COM ALGO EM RESPONSE_OBJECT RESPONDE DE ACORDO com a tupla em RESPONSE_OBJECT (txt/respostas.json)
            // ** CASE InSeNsItIvE **
            let tmpTxt, tmp;
            let allMsgLen = ALL_MESSAGE.length;
            for (let x = 0; x < allMsgLen; x++) {
                tmpTxt = ALL_MESSAGE[x].toString().toLowerCase();
                if (x === allMsgLen-1) { // Caso seja a última palavra, permitir que ela venha seguida de ponto gráfico ("?", ".", etc)
                    tmp = tmpTxt.substring(0, tmpTxt.length-1);
                    if (RESPONSE_OBJECT[tmp]) {
                        message.channel.send(RESPONSE_OBJECT[tmp]);
                        return; // se o bot respondeu algo, não considerar que foi um comando mandado pelo usuario. Responde e finaliza
                        //break;
                    }
                }
                if (RESPONSE_OBJECT[tmpTxt]) { // testar com o 'else'
                    message.channel.send(RESPONSE_OBJECT[tmpTxt]);
                    return; // se o bot respondeu algo, não considerar que foi um comando mandado pelo usuario. Responde e finaliza
                    //break;
                }
            }

			// *********
			// MIRROING *
			// *********
            if (mirrorUser.status === true) {
                if (message.author.id === mirrorUser.id) {
                    switch (mirrorUser.style) {
                        case 'leet':
                            message.channel.send(UTIL.textToLeet(message.content));
                            break;
                        case 'back':
                            message.channel.send(UTIL.textBackwards(message.content));
                            break;

                        default: // Sem "efeito"/argumento
                            message.channel.send(message.content);
                            break;
                    }
                }
            }
			
        }
		// DESABILITADO, POR ENQUANTO FIXME
		// addExp(message, CONFIG.dir.exp, fatorExp, eXp); 
		
		// ÁREA PARA QUANDO MENCIONAREM O NICK DO BOT
        if (message.isMentioned(BOT.user)) {
            let myReply = BOT_REPLY_MENTION[UTIL.pickRandomProperty(BOT_REPLY_MENTION)];
            
            message.reply(myReply);
           // console.log(`BOT_REPLY_MENTION = ${BOT_REPLY_MENTION.obj2} | ${UTIL.pickRandomProperty(BOT_REPLY_MENTION)} `);
		}
    } // end if "!inutil.status" && botStatus.status === online

return;

}); // end of function (bot.on.message)

// *************************
// **** FUNÇÕES DE REACT: > START ****
// *************************

function myReact(mycallback, str) {	// FIXME! Unhandled promise rejection (rejection id: 1): TypeError: Cannot read property 'client' of undefined
    // myReact(message.channel.send, 'cagabundo');
	mycallback(str).catch(e => {console.log('could not react: '+e)});
}

// message: obj message do discord.js | emoji: string do emoji personalizado
function react_emoji(message, emoji) {
    message.react(emoji).catch(e => {console.log('could not react with emoji: '+e)});
	
	return;
}

// message: obj message do discord.js | _txt: string a ser dita no canal
function react_message(message, _txt) {
	message.channel.send(_txt).catch(e => {console.log('could not react with message: '+e)});
	
	return;
}

// *********************************
// **** FUNÇÕES DE REACT: > END *****
// *********************************

function fn_allowDelete(message, allowDelete) {
    allowDelete.flag = !allowDelete.flag;
	let allowDeleteToString = (allowDelete.flag) ? 'sim' : 'não';
	
	message.channel.send(`-> Permitindo que mensagens sejam deletadas sem aviso: ${allowDeleteToString}`);
}

function pikachu(message) {
    message.channel.send(`(\\\\_(\\`);
    message.channel.send(`( ^;^ )`);
    message.channel.send(`(")(")`);
	
	return;
}

function isBotAlive(inutil, botStatus) {
	if (!inutil.status && botStatus.status === 'online') return true;
	return false;
}

// -------------
// FUNÇÃO DE EXP (FIXME: message.author pode estar em dois servidores/canais e será tratado como se fosse um único e grande servidor/canal
// -------------
// "Analisa" cada mensagem enviada pro server (obedecendo ao DESCANSO) e aumenta a EXP de quem digitou algo (tenha sido comando ou não)
// TODO: cria um objeto guardando o message.author, quando um comando for utilizado adicionar a esse obj o usuario
// quando for adicionar/calcular a exp ve se existe algo nesse objeto e se objeto[usuario_que_falou] existe, se sim,
// ajusta uma expRatePerUser[usuario] e adiciona no calculo da exp total
function addExp(message, _expDir, expRate = 1, eXp) {
	const _personStripped = message.author.toString().replace(/\<|\>|\!/g, '');
	const USER_EXP_FILE = _expDir + '/' + _personStripped + '.exp'; // usado no sistema de EXP
	
	let expNow = 0;
	let totalExp = 0;
	//let expRate = 1;
	let expGenerated = UTIL.randomMinMax(5, 25); // how much exp to increase

	if (fs.existsSync(USER_EXP_FILE)) {
		try {
			expNow = parseInt(fs.readFileSync(USER_EXP_FILE, 'utf8'));
		} catch (e) {
			console.err(`parseInt/readFileSync failed!`);
		}
	}
	
	expToIncrease = Math.ceil(expGenerated * expRate);
	totalExp = expNow + expToIncrease;
	eXp.up = expToIncrease;
	
	fs.writeFile(
		USER_EXP_FILE,
		totalExp,
		err => { if (err) throw err; }
	);
} // FIXME: de síncrono -> assíncrono OU apagar e fazer com mysql



BOT.login(TOKEN.token);


BOT.on('error', (err) => {
	let timeNow = new Date().toLocaleTimeString();
	
    console.log(`-- [${timeNow}] Algum erro aconteceu: ${err.message}`);
});


// Only runs if the deleted message was originally sent while the bot was online
BOT.on('messageDelete', (message) => {
    // Loga a mensagem deletada independente de o bot estar 'vivo' no canal ou não
    UTIL.doLog(message, pathFile, '{{this message was deleted}}');

	if (isBotAlive(inutil, botStatus)) {
        if (!allowDelete.flag) {
            //message.channel.send(`Rapaz, não fique deletando mensagens a toa!`);
            message.channel.send(`-> A mensagem **${message.content}** do(a) **${message.author.username}** foi deletada.`);
        }
	}
});


// Not tested yet: when does this happen?
BOT.on('disconnect', (err, code) => {
	console.log(`-- Disconnected! [${err}:${code}] Trying reconnect...`);
	try {
		BOT.connect(); // ou seria (caso o evento realmente funcione) BOT.login(TOKEN.token); ?
	} catch(e) {
		console.log(`Erro no BOT.connect: ${e}`);
	}
	console.log(`-- Reconnected?`);
});

const { throws } = require('assert');
const Discord =         require('discord.js');
const fs =              require('fs');
const CONFIG =          require('./config/config');
const TOKEN =           require(CONFIG.dir.token);
const HELP_LISTA =      require(CONFIG.dir.help);
const RESPONSE_OBJECT = require(CONFIG.dir.respostas); // Deixar todo elemento[0] da tupla em lowercase e sem espaços
const BOT_REPLY_MENTION = require(CONFIG.dir.replies);
const UTIL =            require(CONFIG.dir.util);
const FUNCOES =         require(CONFIG.dir.funcoes);
const MUSIC =           require(CONFIG.dir.music);

const BOT =             new Discord.Client();
// TOOD: FAZER UM "MELHOR DE TRÊS" COM O !COINFLIP


    
const BOT_VERSION =     CONFIG.about.version; // atualizado 10/09/2018
const TAM_PREFIX =      parseInt(CONFIG.preference.tamanho_prefixo); // TAMANHO DO 'CHAR' DE PREFIXO PARA COMANDOS (1: '!' OU '+')
const DESCANSO =        parseInt(CONFIG.preference.intervalo_inativo); // TEMPO, EM MILESEGUNDOS, PARA O BOT FICAR SEM RESPONDER (EVITA SPAM DE COMANDOS)
const DEFAULT_TEMPO_DND = CONFIG.preference.tempo_sleep;
const pathFile = CONFIG.dir.log.logdir+'/'+CONFIG.dir.log.logfile; // FIXME: se o BOT for iniciado de outro local (ex: pelo .bat no desktop), o log.txt é criado no desktop

const EIGHTBALL = ['sim','não','talvez','fuckriuuuu','what?','hell yeah','hoje, amanhã e sempre','...','pode ser que sim, pode ser que não',
    'com certeza','nunca','jamais','sempre', 'as estrelas apontam para o sim', 'vou pensar depois te digo'];
const GRAPHICS_ACCENTUATION = ['.','!','?',',',';'];

const SONHOS = [
    'Essa noite eu tive um sonho, eu sonhei com um pão, pau na bunda, pau na bunda, pau na bunda do João',
    'Essa noite eu tive um sonho, eu sonhei com um camaro, pau na bunda, pau na bunda, pau na bunda do Todaro',
	'Essa noite eu tive um sonho, eu sonhei com umas pulgas, pau na bunda, pau na bunda, pau na bunda do Lucas', 
    'Essa noite eu tive um sonho, eu sonhei com um chamego, pau na bunda, pau na bunda, pau na bunda do Gallego',
	'Essa noite eu tive um sonho, eu sonhei com um robô, pau na bunda, pau na bunda, pau na bunda do Cho',
    'Essa noite eu... não tive um sonho!'
];
const INTERVAL_SERVER_MESSAGES = parseInt(CONFIG.preference.tempo_interval_check) || 60; // Tempo em minutos para ficar mandando mensagem para um canal em especifico, evitando canal idle

const IDLE_MESSAGES_OBJECT = require(CONFIG.dir.idle_messages);

let queue;
let intervalCheckCounter;
let botMandaMensagensAntiIdle = {};
let idleTime = null;
let allowDelete = {};
let inutil = {};
let eXp = {};
let timerGlobals = {}; // Utilizado em cmd_timer()
let timeoutHandler = {}; // instanciado como objeto pra poder ser passado por referência para(s) a(s) função(ões)
let botStatus = {}; // obj (passa-se por referência)
let mirrorUser = {}; // id do usuário na guild | status se está on [o mirror] (true) ou não (false) | style qual estilo (função) pro texto
let MEMO = {};


/* *****************
* COMEÇO DO CÓDIGO *
********************/
// TODO: as variáveis consideradas de "settings" devem ser escritas em um arquivo de configurações e recuperadas do mesmo em toda nova session (ex: botMandaMensagensAntiIdle, mirrorUser)
// TODO: No comando de antiidle (cmd_antiIdleToggle) fazer uma algoritmo pra guardar quais indices ja foram 'falados' e não repetir o mesmo random até TODOS os indices terem ido uma vez
// TODO: onde tiver hardcoded meu nick, fazer com que seja por "roles" ?
// Fazer com que o !antiidle aceite um parâmetro que seja o canal a mandar as mensagens

const init = () => {
    queue = new Map();
    serverQueue = '';
    intervalCheckCounter = 0;
    botMandaMensagensAntiIdle = {flag: false};
    intervalCheckCounter = 0;
    idleTime = null;
    allowDelete = {flag: true};
    inutil = {handler: null, status: null};
    eXp = {up:0};
    timerGlobals = {time: 0, tempo: 0};
    timeoutHandler = {timerHandler:null, botHandler: null, startCommand: null, check: null, intervalCheck: null};
    botStatus = {status:'online'};
    mirrorUser = {id:null, status:false, style: null, name: null};
    MEMO = {byUser: null, content:null, date:null};
}


BOT.on('ready', async () => {

    init();

    const timestampInicio = new Date().toLocaleTimeString();
    console.log(`[${timestampInicio}] ${BOT.user.username} reporting for duty, bro [servers: ${BOT.guilds.size}]`);
});

// MUSIC AREA
//const serverQueue = (queue === "undefined") ? "" : queue.get(message.guild.id);
// END OF MUSIC AREA

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
            case 'fact':    FUNCOES.cmd_randomFact(message); break;
            case 'howto':   FUNCOES.cmd_howTo(message, args); break;
            case 'cool':    FUNCOES.cmd_cool(message, args); break; // 14/02/2019
            case 'tree':    FUNCOES.cmd_tree(message, args); break; // 15/02/2019
            case 'mktree':  FUNCOES.cmd_mktree(message, args); break; // 19/02/2019
            //case 'testOne': FUNCOES.cmd_testOne(message,args); break; // TODO
            // YOUTUBE SONGS FUNCTIONS // FIXME TODO
            // case 'playtubao': MUSIC.execute(message, args, serverQueue); break;
            // case 'skip':    MUSIC.skip(message, serverQueue); break;
            // case 'stop':    MUSIC.stop(message, serverQueue); break;
			// Comandos que não se encaixam em nenhuma categoria
            case 'pikachu': pikachu(message); break;
			// Comandos utilitários
            case 'allowdelete': fn_allowDelete(message, allowDelete); break;    
			case 'antiidle':FUNCOES.cmd_antiIdleToggle(message, botMandaMensagensAntiIdle, ((args[0] !== 'undefined' && !isNaN(args[0])) ? args[0] : INTERVAL_SERVER_MESSAGES), timeoutHandler); break;

            // when it's plain text with no commands fetched from "funcoes.js"
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
            case 'opa':         react_message(message, 'Epa, quem disse opa?'); break;
            case 'epa':         react_message(message, 'Opa, quem disse epa?'); break;
            case 'feelsgoodman':react_emoji(message, '375482435086843904'); break;
            case 'feelsbadman': react_emoji(message, '375482616079581194'); break;
            case 'feelsamazingman': react_emoji(message, '375483155634847746'); break;

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
                    if (RESPONSE_OBJECT[tmp] && GRAPHICS_ACCENTUATION.includes(tmpTxt.slice(-1))) { // ONLY IF THE NEXT CHAR IS IN GRAPHICS_ACCENTUATION
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
            if (mirrorUser === 'undefined' || mirrorUser === {}) return;
            else if (mirrorUser.status === true) {
                if (message.author.id === mirrorUser.id) {
                    let sBeforeMirror = `**${mirrorUser.name}** says: `;
                    let sMessageCntn = `_${message.content}_`;
                    switch (mirrorUser.style) {
                        case 'leet':
                            message.channel.send(`${sBeforeMirror}`+UTIL.textToLeet(`${sMessageCntn}`));
                            break;
                        case 'back':
                            message.channel.send(`${sBeforeMirror}`+UTIL.textBackwards(`${sMessageCntn}`));
                            break;
                        case 'hardmode':
                            message.channel.send(`${sBeforeMirror}`+UTIL.textToHardmode(`${sMessageCntn}`));
                            break;

                        default: // Sem "efeito"/argumento
                            message.channel.send(`${sBeforeMirror} ${sMessageCntn}`);
                            break;
                    }
                    message.delete().catch(O_o => {});
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
    //process.exit(1); // TODO: TEST THIS ON ERROR
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

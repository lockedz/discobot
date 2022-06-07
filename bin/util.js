const { exec } = require('child_process');
const fs = require('fs');

module.exports = {
    normalizeDigits: function(d) {
        if (d < 0 || typeof d === 'undefined') return; // retorna undefined para números negativos | undefined
        if (d >= 100) { return d.toString(); } // retorna o próprio número convertido para String
        return ((d < 10) ? '0'+d.toString() : d.toString());
    },
    fullDate: function() { // Não recebe parâmetros e retorna a data HOJE no formato de String "dd/MM/YYYY"
        let dateObj = new Date();
        let month = this.normalizeDigits(dateObj.getUTCMonth() + 1);
        let day = this.normalizeDigits(dateObj.getUTCDate());
        let year = dateObj.getUTCFullYear();

        return day + '/' + month + '/' + year;
    },
    doLog: function(message, pathFile, moreInfo = '') { // TODO: make an error only log (error.log)
		// Escreve (ou cria, se não existir) arquivo logando o comando utilizado pelo usuário
        // Should have a function to only log - personalizaded - to the console
        let timeNow = new Date().toLocaleTimeString();
        let fullDateAndTime = this.fullDate() + '|' + timeNow;
        let txtLog = `- (${fullDateAndTime}) [${message.author.username}@#${message.channel.name}]: ${message.content} ${moreInfo}\n`;

        if (!fs.existsSync(pathFile)) { // se NÃO existe arquivo, cria a primeira vez
            fs.writeFile(pathFile,
                txtLog,
                err => { if (err) throw err; }
            );
        } else { // Existe arquivo então vamos adicionar à ele
            fs.appendFile(pathFile,
                txtLog,
                err => { if (err) throw err; }
            );
        }

        console.log(txtLog.slice(0, txtLog.length-1));
        return;
    },
    ficarInutil: function(inutil, DESCANSO) { // inutil : Object | DESCANSO : Integer
	    // Faz o bot ficar inativo por um tempo, evitando spam de comandos
        inutil.status = true;
        try {
            inutil.handler = setTimeout(() => { inutil.status = false; }, DESCANSO);
        } catch (e) {
            console.error(e.stack);
        }
    },
    setStatusBOT: function(sts, BOT, botStatus) {
        botStatus.status = sts;
        BOT.user.setStatus(botStatus.status);
        return;
    },
    backToWork: function(msg, sts, texto, BOT, botStatus, timeoutHandler) {
        if (timeoutHandler.botHandler) {
            //timeoutHandler.botHandler = null;
            clearTimeout(timeoutHandler.botHandler);
            this.setStatusBOT(sts, BOT, botStatus);
            msg.channel.send(texto);
        }
        return;
    },
    randomMinMax: (min, max) => {
        if (isNaN(min) || isNaN(max)) return;

        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    textToLeet: (txt) => {
        // texto para t3xt0
        let tmpStr = '';
        
        tmpStr = txt.replace(/a/gi, '4');
        tmpStr = tmpStr.replace(/e/gi, '3');
        tmpStr = tmpStr.replace(/i/gi, '1');
        tmpStr = tmpStr.replace(/o/gi, '0');
        tmpStr = tmpStr.replace(/s/gi, '5');
        tmpStr = tmpStr.replace(/t/gi, '7');
        
        return tmpStr;
    },
    textBackwards: (txt) => {
        // texto para otxet
        let tmpStr = '';
        
        for (let n = txt.length-1; n>=0; n--) {
            tmpStr += txt.charAt(n);
        }

        return tmpStr;
    },
    textToHardmode: (txt) => {
        // text to txxt
        let tmpStr = '';
        tmpStr = txt.replace(/[aeyiou]+/gi, 'x');

        return tmpStr;
    },
    pickRandomProperty: (obj) => { // Thanks StackOverflow
		// IN: 	Object
		// OUT:	ONE OF THE OBJ PROPERTIES INDEX (RANDOM)
        let result = null;
        let count = 0;

        for (let prop in obj) {
            if (Math.random() < 1/++count) 
               result = prop;
        }

        return result; // returns the index
        //return obj[result]; // returns the value
    },
	boolToText: (bool, lang) => {
		// Transforma true para "sim" ou "yes" e false para "no" ou "não"
		// Uso: boolToText(variavelBool, 'PT')
		let boolStr = '';
		
		switch (lang.toLowerCase()) {
			case 'en':
				boolStr = (bool) ? 'yes':'no';
                break;
			case 'pt':
			default:
				boolStr = (bool) ? 'sim':'não';
				break;
		}
				
		return boolStr;
	},
    doActionIfThreshold: (threshold = 0.5) => { // Calls another function / action if a threshold requirement is met
        // in:  float [0,1[ threshold
        // out: true to execute or false to not execute
        if (threshold === undefined || threshold === null || typeof threshold !== "number") { return; }
        let fRandomNumZeroToOne = Math.random();
        let execute = false;

        execute = (threshold <= fRandomNumZeroToOne) ? true : false;

        if (!execute) {
            console.log(`-> Did not execute! Threshold = ${threshold} > ${fRandomNumZeroToOne}!`);
        }
        
        return execute;
    }
};
const UTIL =    require(`../bin/util`);

const CALENDAR = {
		monNames : new Array("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"),
		
		get monObject() {
			return this.monNames;
		},

		plotCalendar: (message) => {
			let d = new Date();

			//let dDayToday = d.getDay(); // Day of the WEEK
			let dYearToday = d.getFullYear();
			let dDayOfTheMonthToday = d.getDate();
			let dMonthToday = d.getMonth();
			let dNewDateToday = new Date(dYearToday, dMonthToday, 0); // same has 'd'? FIXME
			let dDayOfTheWeekToday = dNewDateToday.getDay();
			let dTotalDaysThisMonth = dNewDateToday.getDate();

			// Text (all together "as" table)
			let table = [`Today is **${UTIL.normalizeDigits(dDayOfTheMonthToday)}** of **${CALENDAR.monObject[dMonthToday]}** of **${dYearToday}**`]; // as an Array of Strings

			table.push(`\`\`\`fix\n`); // monospace yellow | css for green
			//  _  1  2  3  4  5  6
			// 29 30 31 | 1  2  3  4  
			for (let i = 0; i < dDayOfTheWeekToday; i++) { // Espaços vazios (se houverem) no começo do mês
				table.push(`  `);
			}

			for (let n = 1; n < dTotalDaysThisMonth; n++) {
				if (dDayOfTheMonthToday === n) { // TODAY, BOLD IT! [FIXME: HOW?]
					table.push(`${UTIL.normalizeDigits(dDayOfTheMonthToday)}`);
				} else { // Other month days, normal style
					table.push(`${UTIL.normalizeDigits(n)}`);
				}

				if ((table.length-1) % 8 === 0) { // End of Week, new line (adjust for the strings added to the table variable [\n, '] thus); [FIXME: why 8 and not 7?]
					table.push('\n');
				}
					
				// 	if (arrayDatas[dDayToday] == 1) { // Se nesse dia existe algum agendamento marcado
				// 		table.push('<li><a href="./agendamento.php?dayToday='+dDayToday+'&monToday='+mon+'&yearToday='+year+'#listagem"><strong>'+normalizeDigits(dDayToday)+'</strong></a></li>');
				// 	}
				// 	else {
				// 		table.push('<li><a href="./agendamento.php?dayToday='+dDayToday+'&monToday='+mon+'&yearToday='+year+'#listagem">'+normalizeDigits(dDayToday)+'</a></li>');
				// 	}
				// }

			
				//d.setDate(parseInt(d+1)); // Push day plus 1 (old, if using getDate() to calculate)
				// LINHA ABAIXO É O FIX DO PROBLEMA DE 14 DE OUTUBRO DE 2017 (dois dias 14 eram listados especificamente e apenas nessa data)
				// if (d.getDay() == dDayToday) d.setDate(parseInt(d.getDay() + 1)); // caso "adicionando um dia" ainda seja o "mesmo dia", força mais um dia novamente
			}

			for (let i = dDayOfTheMonthToday; i < 7 && i > 0; i++) { // Espaços vazios (se houverem) ao final do mês
				table.push('  ');
			}

			table.push(`\`\`\``); // monospace
			
			let sFinalResultTable = table.join(' ');

			message.channel.send(`${sFinalResultTable}`);
		}
};

module.exports = CALENDAR;
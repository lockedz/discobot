const ytdl = require("ytdl-core");

module.exports = {
    execute: async function(message, args, serverQueue) {
        //const voiceChannelID = '387387263669239826';
        let voiceMember = message.author;
        // console.log(voiceMember);
        // let temp1 = '';
        // Object.keys(voiceMember.lastMessage.member).forEach((key, idx, val) => {
        //     if (key == 'voiceChannelID') { console.log(`${key}`); temp1 = key; }
        // });
        const newMap = new Map(Object.entries(voiceMember.lastMessage.member));
        let temp1 = newMap.get('guild');
        //const newMap2 = new Map(Object.entries(temp1['channels']));
        newMap2 = temp1.channels.get('VoiceChannel');
       
        console.log(newMap2);
 

        //const voiceChannel = temp1;
        //console.log(`${typeof voiceChannel}`)

        //const voiceChannel = voiceChannelID;

        //console.log(`voiceChannel = ${voiceChannel}`)
        
        if (!voiceChannel) {
            return message.channel.send("You need to be in a voice channel to play music!");
        }
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
            return message.channel.send("I need the permissions to join and speak in your voice channel!");
        }

        const songInfo = await ytdl.getInfo(args[1]);
        const song = {
            title: songInfo.videoDetails.title,
            url: songInfo.videoDetails.video_url,
        };

        if (!serverQueue) {
            const queueContruct = {
                textChannel: message.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 5,
                playing: true
        };

        queue.set(message.guild.id, queueContruct);
        queueContruct.songs.push(song);

        try {
            var connection = await voiceChannel.join();
            queueContruct.connection = connection;
            play(message.guild, queueContruct.songs[0]);
        } catch (err) {
            console.log(err);
            queue.delete(message.guild.id);

            return message.channel.send(err);
        }
        } else {
            serverQueue.songs.push(song);

            return message.channel.send(`${song.title} has been added to the queue!`);
        }
    },
    skip: function(message, serverQueue) {
        if (!message.member.voice.channel)
            return message.channel.send("You have to be in a voice channel to stop the music!");
        if (!serverQueue)
            return message.channel.send("There is no song that I could skip!");
            
        serverQueue.connection.dispatcher.end();
    },
    stop: function(message, serverQueue) {
        if (!message.member.voice.channel)
            return message.channel.send("You have to be in a voice channel to stop the music!");
            
        if (!serverQueue)
            return message.channel.send("There is no song that I could stop!");
            
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end();
    },
    play: function(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);

        return;
    }

    const dispatcher = serverQueue.connection
        .play(ytdl(song.url))
        .on("finish", () => {
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on("error", error => console.error(error));

    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

    serverQueue.textChannel.send(`Started playing: **${song.title}**`);
    }
};
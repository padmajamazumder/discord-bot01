const { Client, GatewayIntentBits } = require('discord.js');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

const token = 'MTI2MDQwMjY4MDEzMjc5NjUyNg.G9hBi9.njW5TqHDmumUnjEp20IdUI6Q4_1hKAluEruu_A';

client.once('ready', () => {
    console.log('Bot is online!');
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const args = message.content.split(' ');
    if (args[0] === '!download') {
        console.log('Received download command');
        
        if (args.length < 3) {
            console.log('Insufficient arguments provided');
            return message.channel.send('Usage: !download <YouTube URL> <format (mp3/mp4)>');
        }

        const url = args[1];
        const format = args[2];
        
        if (!ytdl.validateURL(url)) {
            console.log('Invalid YouTube URL');
            return message.channel.send('Invalid YouTube URL.');
        }

        try {
            const info = await ytdl.getInfo(url);
            const title = info.videoDetails.title.replace(/[\/\\?%*:|"<>]/g, '');
            console.log(`Downloading: ${title} in ${format} format`);

            const downloadsDir = path.join(__dirname, 'downloads');
            if (!fs.existsSync(downloadsDir)) {
                console.log('Creating downloads directory');
                fs.mkdirSync(downloadsDir);
            }

            const filePath = path.join(downloadsDir, `${title}.${format}`);
            
            if (format === 'mp3') {
                console.log('Starting mp3 download');
                ffmpeg(ytdl(url, { quality: 'highestaudio' }))
                    .audioBitrate(128)
                    .toFormat('mp3')
                    .save(filePath)
                    .on('end', () => {
                        console.log(`Downloaded ${title}.mp3`);
                        message.channel.send({
                            files: [{
                                attachment: filePath,
                                name: `${title}.mp3`
                            }]
                        }).then(() => {
                            fs.unlinkSync(filePath);
                        });
                    })
                    .on('error', err => {
                        console.error(`Error during conversion to mp3: ${err.message}`);
                        message.channel.send('There was an error downloading the MP3 file.');
                    });
            } else if (format === 'mp4') {
                console.log('Starting mp4 download');
                ytdl(url, { quality: 'highestvideo' })
                    .pipe(fs.createWriteStream(filePath))
                    .on('finish', () => {
                        console.log(`Downloaded ${title}.mp4`);
                        message.channel.send({
                            files: [{
                                attachment: filePath,
                                name: `${title}.mp4`
                            }]
                        }).then(() => {
                            fs.unlinkSync(filePath);
                        });
                    })
                    .on('error', err => {
                        console.error(`Error during downloading video: ${err.message}`);
                        message.channel.send('There was an error downloading the MP4 file.');
                    });
            } else {
                console.log('Invalid format specified');
                return message.channel.send('Invalid format. Use "mp3" or "mp4".');
            }
        } catch (error) {
            console.error(`Error during download process: ${error.message}`);
            message.channel.send('There was an error processing your download request.');
        }
    }
});

client.login(token);

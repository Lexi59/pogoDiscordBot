const { Client, Intents, MessageEmbed, MessageFlags  } = require('discord.js');
const axios = require('axios');
require('dotenv').config({ path: '.env' })
const puppeteer = require('puppeteer');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });
client.login(process.env.BOT_TOKEN);

client.on('ready', readyDiscord);
client.on('messageCreate', gotMessage);
client.on('messageReactionAdd', gotReaction);

var tierColors = {'1':'#ef939d', '2':'#ef939d','3':'#dcb53b', '4':'#dcb53b','5':'#3a548a', 'mega':'#9c3e46'};
var emojiCodes = {'1': '958755283625197630', '2':'958755283600048138', '3':'958755283532927066','4':'958755285307109446','5':'958755283507757126','remote':'958748160161906748','in-person':'958748160057036820'}
var raidHourNumMessageID = "", raidHourLocMessageID = "";
var attendees = [];
var route = [];
var currStop  = 0;

function readyDiscord(){
    console.log("Bot is ready");
}

async function gotMessage(msg){
    if(msg.channel.id == process.env.CHANNEL_ID && msg.content.trim().indexOf('!') == 0){

        if(msg.content.includes('!pvp ')){
            if(msg.content.split(' ').length >= 2){
                var mon = msg.content.split(' ')[1].trim();
                mon = mon.replace(/-/g, '_');
                mon = mon.replace(/\'/g, '');
                var league;
                if(msg.content.split(' ')[2]){
                    league = msg.content.split(' ')[2].trim().toLowerCase();
                }
                else{
                    league = 'all';
                }
                var cp = 'All';
                
                (async function scrape() {
                    const browser = await puppeteer.launch({ headless: true, args:["--no-sandbox"] });
                    const page = await browser.newPage();
                    await page.goto('https://pvpivs.com/searchStr.html');

                    if(league == 'little'){cp = '500'}
                    else if (league == 'great'){cp = '1500'}
                    else if (league == 'ultra'){cp = '2500'}
                    else if (league == 'master'){cp = 'false'}
                    else if (league == 'all'){cp = 'All'}

                    await page.waitForSelector('#league');
                    await page.select('#league', cp);

                    page.waitForSelector('#pokeList');
                    await page.focus('#pokeList')
                    await page.keyboard.type(mon);

                    await page.waitForSelector('#awesomplete_list_1');

                    try{
                        await page.waitForSelector('#awesomplete_list_1_item_0',{timeout: 750});
                    }
                    catch(e){
                        msg.channel.send('Pokemon ' + mon + ' does not exist. If there is a space in the name, replace it with _');
                        await browser.close();
                        return;
                    }
                
                    await page.click('#awesomplete_list_1_item_0');
                    await page.waitForSelector('#output');
                    let element = await page.$('#output')
                    let value = await page.evaluate(el => el.value, element)
                    value = value.replace(/\*/g, '\\*');
                    let summary = await page.$('#outputSummaryBox')
                    let text = await page.evaluate(el => el.textContent, summary)
                    
                    const exampleEmbed = new MessageEmbed()
                        .setColor('#A90A15')
                        .setTitle(text)
                        .setURL(page.url())
                        .setDescription(value)
                        .setTimestamp()
    
                    msg.channel.send({ embeds: [exampleEmbed] });
                    await browser.close();
                })();
            }
        }
        else if(msg.content.includes('!leg')){
            axios.get('https://pogoapi.net/api/v1/raid_bosses.json', {})
            .then(function(response) {
                var boss = response.data.current['5'][0];
                console.log(boss);
                
                const exampleEmbed = new MessageEmbed()
                .setColor(tierColors[boss['tier']])
                .setTitle('Current Level 5 Raid Boss')
                .setURL('https://pokemongohub.net/raid-guides/')
                .setDescription(boss['name'] + ' (' + boss['form'] + ' )')
                .addFields(
                    { name: 'Type(s)', value: boss['type'].join(',') },
                    { name: 'Boosted Weather', value: boss['boosted_weather'].join(',') },
                    { name: 'Unboosted CP', value: boss['min_unboosted_cp'] + '-**' + boss['max_unboosted_cp']+"**", inline: true },
                    { name: 'Boosted CP', value: boss['min_boosted_cp'] + '-**' + boss['max_boosted_cp']+"**", inline: true },
                )
                .addField('Possible Shiny:', boss['possible_shiny']?'Yes':'No', true)
                .setTimestamp()
    
                msg.channel.send({ embeds: [exampleEmbed] });
            });
        }
        else if(msg.content.includes('!mega')){
            axios.get('https://pogoapi.net/api/v1/raid_bosses.json', {})
            .then(function(response) {
                var boss = response.data.current['mega'][0];
                console.log(boss);
                
                const exampleEmbed = new MessageEmbed()
                .setColor(tierColors[boss['tier']])
                .setTitle('Current Mega Raid Boss')
                .setURL('https://pokemongohub.net/raid-guides/')
                .setDescription(boss['name'] + ' (' + boss['form'] + ')')
                .addFields(
                    { name: 'Type(s)', value: boss['type'].join(',') },
                    { name: 'Boosted Weather', value: boss['boosted_weather'].join(',') },
                    { name: 'Unboosted CP', value: boss['min_unboosted_cp'] + '-**' + boss['max_unboosted_cp']+"**", inline: true },
                    { name: 'Boosted CP', value: boss['min_boosted_cp'] + '-**' + boss['max_boosted_cp']+"**", inline: true },
                )
                .addField('Possible Shiny:', boss['possible_shiny']?'Yes':'No', true)
                .setTimestamp()
    
                msg.channel.send({ embeds: [exampleEmbed] });
            });
        }
        else if(msg.content.includes('!raidhour')){
            axios.get('https://pogoapi.net/api/v1/raid_bosses.json', {})
            .then(function(response) {
                var boss = response.data.current['5'][0];
                console.log(boss);
                attendees = [];
                route = [];
                currStop = 0;
                
                const exampleEmbed = new MessageEmbed()
                .setColor(tierColors[boss['tier']])
                .setTitle('Raid Hour Details')
                .setURL('https://pokemongohub.net/raid-guides/')
                .setDescription(boss['name'] + ' (' + boss['form'] + ' )')
                .addFields(
                    { name: 'Type(s)', value: boss['type'].join(',') },
                    { name: 'Boosted Weather', value: boss['boosted_weather'].join(',') },
                    { name: 'Unboosted CP', value: boss['min_unboosted_cp'] + '-**' + boss['max_unboosted_cp']+"**", inline: true },
                    { name: 'Boosted CP', value: boss['min_boosted_cp'] + '-**' + boss['max_boosted_cp']+"**", inline: true },
                )
                .addField('Possible Shiny:', boss['possible_shiny']?'Yes':'No', true)
                .addField('\u200B','\u200B')
                .addField('Reserve a Spot', "Please react with the number of accounts you are bringing to raid hour!")
                .setTimestamp()
                msg.channel.send({ embeds: [exampleEmbed] }).then(sent =>{
                    raidHourNumMessageID = sent.id;
                    sent.react(emojiCodes['1']);
                    sent.react(emojiCodes['2']);
                    sent.react(emojiCodes['3']);
                    sent.react(emojiCodes['4']);
                    sent.react(emojiCodes['5']);
                });
                msg.channel.send("Please react with in-person or remote").then(sent =>{
                    raidHourLocMessageID = sent.id;
                    sent.react(emojiCodes['in-person']);
                    sent.react(emojiCodes['remote']);
                })
            });
        }
        else if(msg.content.includes('!raid ')){
            axios.get('https://pogoapi.net/api/v1/raid_bosses.json', {})
            .then(function(response) {
                var name = msg.content.split(' ')[1];
                var boss, curr;
                
                var current = response.data.current;
                for(var key in current){
                    for(var item in current[key]){
                        if((current[key][item]['name']).toString().toLowerCase() == name.toLowerCase()){
                            boss = current[key][item];
                            curr = true;
                        }
                    }
                }
                var previous = response.data.previous;
                for(var key in previous){
                    for(var item in previous[key]){
                        if((previous[key][item]['name']).toString().toLowerCase() == name.toLowerCase()){
                            boss = previous[key][item];
                            curr = false;
                        }
                    }
                }
                
                console.log(boss);
                
                if(boss){
                    const exampleEmbed = new MessageEmbed()
                    .setColor(tierColors[boss['tier'].toString()])
                    .setTitle('Raid Boss Info')
                    .setURL('https://pokemongohub.net/raid-guides/')
                    .setDescription(boss['name'] + ' (' + boss['form'] + ')')
                    .addFields(
                        { name: 'Current Raid Boss', value: curr?'Yes':'No', inline:true},
                        { name: 'Tier', value: boss['tier'].toString(), inline:true},
                        { name: 'Type(s)', value: boss['type'].join(',') },
                        { name: 'Boosted Weather', value: boss['boosted_weather'].join(',') },
                        { name: 'Unboosted CP', value: boss['min_unboosted_cp'] + '-**' + boss['max_unboosted_cp']+"**", inline: true },
                        { name: 'Boosted CP', value: boss['min_boosted_cp'] + '-**' + boss['max_boosted_cp']+"**", inline: true },
                    )
                    .addField('Possible Shiny:', boss['possible_shiny']?'Yes':'No', true)
                    .setTimestamp()
        
                    msg.channel.send({ embeds: [exampleEmbed] });
                }
                else{
                    msg.channel.send("Unable to find a raid boss named " + name + ".");
                }
            });
        }
        else if (msg.content.includes('!raiders')){
            console.log(attendees);
            var totalPeople = 0;
            var totalInPerson = 0;
            var totalRemote = 0;
            var inPersonList = [];
            var remoteList = [];
            for(var i = 0; i < attendees.length; i++){
                var person = attendees[i];
                totalPeople += parseInt(person['num']);
                if(person['loc'] == 'remotely'){
                    totalRemote += parseInt(person['num'])
                    remoteList.push(person['name'] + ' +' + (parseInt(person['num'])-1));
                }
                else if (person['loc'] == 'in-person'){
                    totalInPerson += person['num']
                    inPersonList.push(person['name'] + ' +' + (parseInt(person['num'])-1));
                }
            }
            if(inPersonList.length == 0){inPersonList.push('No one')}
            if(remoteList.length == 0){remoteList.push('No one')}
            console.log(totalInPerson, totalRemote, totalPeople, inPersonList, remoteList);

            const exampleEmbed = new MessageEmbed()
            .setColor('#000000')
            .setTitle('Raid Hour Attendees')
            .setDescription("People attending raid hour")
            .addFields(
                { name: 'Total', value: totalPeople.toString()},
                { name: 'Remote', value: totalRemote.toString(), inline:true},
                { name: 'In Person', value: totalInPerson.toString(), inline:true },
                { name: '\u200B', value: '\u200B' },
                { name: 'Remote attendees', value: remoteList.join('\n'),inline: true },
                { name: 'In Person attendees', value: inPersonList.join('\n'), inline: true},                
            )
            .setTimestamp()

            msg.channel.send({ embeds: [exampleEmbed] });
        }
        else if (msg.content.includes('!done')){
            var found = false;
            for(var i =0; i< attendees.length; i++){
                if(msg.author.username == attendees[i]['name']){
                    attendees.splice(i,1);
                    i = attendees.length;
                    msg.channel.send(msg.author.username + " has been removed from raid hour.");
                    found = true;
                }
            }
            if(!found){
                msg.channel.send(msg.author.username + " was not signed up for raid hour");
            }
        }
        else if (msg.content.includes('!setroute\n')|| msg.content.includes('!setroute \n')){
            route = msg.content.split('\n')
            route.splice(0,1);
            currStop = 0;
            msg.channel.send("Route set with " + route.length + " stops.");
        }
        else if (msg.content.includes('!start')){
            if(route.length == 0){
                msg.channel.send("Please set route first using !setroute command");
            }
            else if(currStop + 1 < route.length){
                msg.channel.send('Starting **'+ route[currStop] + '**, **'+route[currStop+1] + '** is next.');
                currStop++;
            }
            else if (currStop == route.length -1){
                msg.channel.send("Last stop: **" + route[currStop] + "**. Starting now. Thanks everyone!")
                currStop++;
            }
            else{
                msg.channel.send("Unable to start next gym...");
            }

        }
        else if (msg.content.includes("!clearroute")){
            route=[];
            msg.channel.send("Route has been cleared");
        }
        else if(msg.content.includes("!viewroute")){
            if(route.length > 0){
                route[currStop] += '    <-';
                msg.channel.send(route.join('\n'));
                route[currStop] = route[currStop].replace('    <-','');
            }
            else{
                msg.channel.send("No route set. Set one using '!setroute'.")
            }
        }
        else if (msg.content.includes("!add ")){
            var name = msg.content.replace('!add ','').trim();
            if(name.includes(' after ')){
                var insertItem= name.split(' after ')[0];
                var afterItem = name.split(' after ')[1];
                for(var i = 0; i < route.length; i++){
                    if(route[i].toLowerCase().trim() == afterItem.toString().toLowerCase().trim()){
                        route.splice(i+1,0,insertItem);
                        i=1000;
                        msg.channel.send("Added " + insertItem + " after " + afterItem);
                    }
                }
                if(i < 1000){
                    msg.channel.send('Unable to find gym in route named ' + afterItem);
                }
            }
            else{
                if(name.length > 0) route.push(name);
                msg.channel.send(name + ' added to end.');
            }
        }
        else if(msg.content.includes("!next")){
            if(currStop < route.length){
                msg.channel.send("**" + route[currStop] + "** is next.");
            }
            else{
                msg.channel.send("Unable to find next stop.");
            }
        }
        else if (msg.content.includes("!skip")){
            if(currStop + 1 < route.length)
            {
                msg.channel.send('Skipping '+ route[currStop] + ', ** go to '+route[currStop+1] + '**.');
                currStop++;
            }
            else if(currStop == route.length -1)
            {
                msg.channel.send("Skipping " + route[currStop] + ". **All done**. Thanks everyone.");
                currStop++;
            }
        }
        else if(msg.content.includes('!endroute after ')){
            var lastGym= msg.content.split('!endroute after ')[1].trim();
            for(var i = 0; i < route.length; i++){
                if(lastGym.toLowerCase() == route[i].toLowerCase()){
                    route.splice(i+1);
                    i = 1000;
                    msg.channel.send("Route will end after " + lastGym);
                }
            }
            if(i < 1000){
                msg.channel.send("Unable to find gym on route called " + lastGym);
            }
        }
        else if(msg.content.includes('!help')){
            if(msg.content.split(' ').length >= 2){
                var help = msg.content.replace('!help ','').trim().toLowerCase();
                if(help == 'raidboss'){
                    msg.channel.send('**Raid Boss Commands**\n*!leg*\t will show information about current legendary pokemon\n*!mega*\t will show information about current mega pokemon\n*!raid <pokemon name>*\t will show information about that raid boss (past and present)');
                }
                else if (help == 'raidhour'){
                    msg.channel.send('**Raid Hour Commands:**\n*!raidhour*\t will send messages that allow for people to RSVP for raid hour (this clears past route and attendees)\n*!raiders*\t will show information on who has signed up to attend raid hour\n*!done*\t will mark the user who sent the message as no longer participating in raid hour\n**Route Commands**\n*!next*\t will tell you which gym is next\n*!viewroute*\t will show the current route, including an arrow for the next gym on the route\n**Admin Route Commands**\n*!setroute*\t will allow admin to set the route for raid hour\n*!start*\t will display a message explaining which lobby started and which gym is next\n*!add <gym name>*\t will add that gym to the end of the route\n*!add <gym name> after <gym name>*\t will add a stop in the middle of a route\n*!skip*\t will skip the next gym on the route and go to the next one\n*!clearroute*\t will clear the whole route\n*!endroute after <gym name>*\t will end the route after the listed gym')
                }
                else if (help == 'pvp'){
                    msg.channel.send("**!pvp <pokemon_name> <league>**\nThis returns a search string for the top 10 PvP IVs. If you want more details or more than the top 10, click the title.\n\nIf the pokemon name has a space, please replace it with _\nShadow doesn't affect the search string, so ignore it.\nIf you want to look for alolan pokemon, search **<pokemon_name>_Alola**\nFor Galarian pokemon, search **<pokemon_name>_Galarian**\nFor Hisuian, type **<pokemon_name>_Hisuian**\nIf there are multiple forms, use an underscore (e.g. **Giratina_Origin, Deoxys_Speed, Mewtwo_A, Thundurus_Therian**, etc)\nIf the pokemon have different sizes, the options are: **Small, Average, Large, Super** (e.g. Pumpkaboo_Large)\n\nThe league options are: **little, great, ultra, master, all**\n\tLeaving the league off of the command, automatically **assumes all leagues.**")
                }
            }
            else{
                 msg.channel.send("If you want help with learning about raid bosses, send *!help raidboss*\nIf you want help with raid hour commands, send *!help raidhour*\nIf you want help with PvP IVs, send *!help pvp*");
            }            
        }
        else{
            msg.channel.send("Sorry, I don't recognize that command! Type *!help* to see available commands");
        }
    }
}

function gotReaction(reaction, user){

    if(reaction.message.channelId == process.env.CHANNEL_ID && reaction.message.author.bot && !user.bot){
        if(reaction.message.id == raidHourNumMessageID){
            console.log(user.username + ' is bringing ' + reaction.emoji.identifier.split('_:')[0]);
            var found = false;
            for(var i = 0; i < attendees.length; i++){
                if(attendees[i].name == user.username){
                    found = true;
                    attendees[i]['num'] = parseInt(reaction.emoji.identifier.split('_:')[0]);
                }
            }
            if(!found){
                attendees.push({'name':user.username, 'num': parseInt(reaction.emoji.identifier.split('_:')[0])})
            }
        }
        else if (reaction.message.id == raidHourLocMessageID){
            var loc = reaction.emoji.identifier.includes('premium_battle_pass')?'in-person':'remotely';
            console.log(user.username + ' is attending ' + loc);
            var found = false;
            for(var i = 0; i < attendees.length; i++){
                if(attendees[i].name == user.username){
                    found = true;
                    attendees[i]['loc'] = loc;
                }
            }
            if(!found){
                attendees.push({'name':user.username, loc})
            }
        }
    }
}
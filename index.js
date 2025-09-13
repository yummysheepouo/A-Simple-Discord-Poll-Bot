const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionsBitField } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});


const activePolls = new Map();


client.once('ready', () => {
  console.log(`Log in as ${client.user.tag}`);
  registerCommands();
});

async function registerCommands() {
  const commands = [
    {
      name: 'poll',
      description: 'Poll commands',
      options: [
        {
          name: 'create',
          description: 'create a poll',
          type: 1, // SUB_COMMAND
          options: [
            {
              name: 'question',
              description: 'Topic or question of the poll',
              type: 3, // STRING
              required: true
            },
            {
              name: 'description',
              description: 'Details about the poll',
              type: 3, // STRING
              required: true
            },
            {
              name: 'option',
              description: 'Poll option (use "," to seperate each options. Such as David,Marry,John)',
              type: 3, // STRING
              required: true
            },
            {
              name: 'limit',
              description: 'Are only old members allowed to vote (joined more than 7 days)',
              type: 3, // STRING
              required: true,
              choices: [
                { name: 'Yes', value: 'yes' },
                { name: 'No', value: 'no' }
              ]
            },
            {
              name: 'duration',
              description: 'Poll duration',
              type: 3, // STRING
              required: true,
              choices: [
                { name: '1 Hour', value: '1hr' },
                { name: '12 Hours', value: '12hr' },
                { name: '1 Day', value: '1d' },
                { name: '3 Days', value: '3d' },
                { name: '5 Days', value: '5d' },
                { name: '7 Days', value: '7d' },
                { name: '10 Days', value: '10d' },
                { name: '14 Days', value: '14d' }
              ]
            },
            {
              name: 'change',
              description: 'Can members change their votes',
              type: 3, // STRING
              required: true,
              choices: [
                { name: 'Yes', value: 'yes' },
                { name: 'No', value: 'no' }
              ]
            },
            {
              name: 'multiple',
              description: 'Maximum number of votes per member (1-10)',
              type: 4, // INTEGER
              required: true,
              min_value: 1,
              max_value: 10
            },
            {
              name: 'image',
              description: 'Image URL for the poll (optional)',
              type: 3, // STRING
              required: false
            }
          ]
        },
        {
          name: 'end',
          description: 'End a poll by ID',
          type: 1, // SUB_COMMAND
          options: [
            {
              name: 'id',
              description: 'Poll ID',
              type: 3, // STRING
              required: true
            }
          ]
        }
      ]
    }
  ];

  try {
    await client.application.commands.set(commands);
    console.log('Slashcommands registered successfully.');
  } catch (error) {
    console.error('Fail to register slashcommands:', error);
  }
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === 'poll') {
    const subcommand = options.getSubcommand();

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return await interaction.reply({
        content: '⚠️ You need to be an administrator to use this command.',
        ephemeral: true
      });
    }

    if (subcommand === 'create') {
      await handlePollCreate(interaction);
    } else if (subcommand === 'end') {
      await handlePollEnd(interaction);
    }
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId.startsWith('vote_')) {
    await handleVote(interaction);
  }
});

async function handlePollCreate(interaction) {
  try {
    const question = interaction.options.getString('question');
    const description = interaction.options.getString('description');
    const optionsString = interaction.options.getString('option');
    const imageUrl = interaction.options.getString('image');
    const limit = interaction.options.getString('limit');
    const duration = interaction.options.getString('duration');
    const change = interaction.options.getString('change');
    const multiple = interaction.options.getInteger('multiple');
    const pollOptions = optionsString.split(',').map(opt => opt.trim());
    
    if (pollOptions.length > 10) {
      return await interaction.reply({
        content: '⚠️ Error: MAX 10 options allowed',
        ephemeral: true
      });
    }

    if (pollOptions.length < 2) {
      return await interaction.reply({
        content: '⚠️ Error: At least 2 options are required',
        ephemeral: true
      });
    }


    const pollId = Date.now().toString();


    const endTime = calculateEndTime(duration);


    const buttons = createPollButtons(pollOptions, pollId);
    

    const pollEmbed = new EmbedBuilder()
      .setTitle(`📊 ${question}`)
      .setDescription(description)
      .setColor('#3498db')
      .addFields(
        { name: 'Options', value: pollOptions.map((opt, index) => `${index + 1}. ${opt} (0 vote)`).join('\n') },
        { name: 'Rules', value: `Everyone can vote for ${multiple} times\nChange vote: ${change === 'yes' ? 'Yes' : 'No'}\nOld Member Only: ${limit === 'yes' ? 'Yes' : 'No'}` },
        { name: 'End Time', value: `<t:${Math.floor(endTime / 1000)}:F> (<t:${Math.floor(endTime / 1000)}:R>)` }
      )
      .setFooter({ text: `Poll ID: ${pollId}` })
      .setTimestamp();

    if (imageUrl) {
      pollEmbed.setImage(imageUrl);
    }


    const pollData = {
      id: pollId,
      question,
      description,
      options: pollOptions,
      votes: pollOptions.map(() => []), 
      limit: limit === 'yes',
      endTime,
      change: change === 'yes',
      multiple,
      voters: {}, 
      messageId: null,
      channelId: interaction.channelId 
    };

  
    const reply = await interaction.reply({
      embeds: [pollEmbed],
      components: buttons,
      fetchReply: true
    });

    pollData.messageId = reply.id;
    activePolls.set(pollId, pollData);

    setTimeout(() => endPoll(pollId, interaction.channel), endTime - Date.now());

  } catch (error) {
    console.error('Fail to create a poll', error);
    await interaction.reply({
      content: '⚠️ Failed to create poll, please try again later.',
      ephemeral: true
    });
  }
}


async function handlePollEnd(interaction) {
  try {
    const pollId = interaction.options.getString('id');
    
    if (!activePolls.has(pollId)) {
      return await interaction.reply({
        content: '⚠️ No active poll found with the provided ID or it has already ended.',
        ephemeral: true
      });
    }
    

    await endPoll(pollId, interaction.channel);
    
    await interaction.reply({
      content: `✅ Poll with ID ${pollId} has been ended. (ID: ${pollId})`,
      ephemeral: true
    });
  } catch (error) {
    console.error('Poll fail to be ended', error);
    await interaction.reply({
      content: '⚠️ Failed to end poll, please try again later.',
      ephemeral: true
    });
  }
}


async function handleVote(interaction) {
  try {
    const [_, pollId, optionIndex] = interaction.customId.split('_');
    const optionIdx = parseInt(optionIndex);
    
    const pollData = activePolls.get(pollId);
    if (!pollData) {
      return await interaction.reply({
        content: '⚠️ This poll is no longer active.',
        ephemeral: true
      });
    }


    if (Date.now() > pollData.endTime) {
      return await interaction.reply({
        content: '⚠️ This poll has already ended.',
        ephemeral: true
      });
    }

    const userId = interaction.user.id;
    const member = await interaction.guild.members.fetch(userId);


    if (pollData.limit) {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (member.joinedTimestamp > sevenDaysAgo) {
        return await interaction.reply({
          content: '⚠️ Only members who joined more than 7 days ago can vote in this poll.',
          ephemeral: true
        });
      }
    }


    if (!pollData.voters[userId]) {
      pollData.voters[userId] = [];
    }


    const userVotes = pollData.voters[userId];
    const hasVotedForThisOption = userVotes.includes(optionIdx);

    if (pollData.change) {
      if (hasVotedForThisOption) {
        
        pollData.voters[userId] = userVotes.filter(idx => idx !== optionIdx);
        pollData.votes[optionIdx] = pollData.votes[optionIdx].filter(id => id !== userId);
        
        await interaction.reply({
          content: `✅ You have unvote「${pollData.options[optionIdx]}`,
          ephemeral: true
        });
      } else {
        
        if (userVotes.length >= pollData.multiple) {
          return await interaction.reply({
            content: `⚠️ You only able to vote for ${pollData.multiple} times。Unvote some options first if you want to vote for new option.`,
            ephemeral: true
          });
        }
        
        
        pollData.voters[userId].push(optionIdx);
        pollData.votes[optionIdx].push(userId);
        
        await interaction.reply({
          content: `✅ You voted for「${pollData.options[optionIdx]}」`,
          ephemeral: true
        });
      }
    } else {
     
      if (hasVotedForThisOption) {
        return await interaction.reply({
          content: `⚠️ You already voted for「${pollData.options[optionIdx]}」`,
          ephemeral: true
        });
      }
      
      
      if (userVotes.length >= pollData.multiple) {
        return await interaction.reply({
          content: `⚠️ You have reached MAX vote numbers (${pollData.multiple})`,
          ephemeral: true
        });
      }
      
      
      pollData.voters[userId].push(optionIdx);
      pollData.votes[optionIdx].push(userId);
      
      await interaction.reply({
        content: `✅ You voted to「${pollData.options[optionIdx]}」`,
        ephemeral: true
      });
    }

  
    await updatePollEmbed(interaction.channel, pollData);

  } catch (error) {
    console.error('Fail to handle voting', error);
    await interaction.reply({
      content: '⚠️ Failed to process your vote, please try again later.',
      ephemeral: true
    });
  }
}


async function updatePollEmbed(channel, pollData) {
  try {
    const message = await channel.messages.fetch(pollData.messageId);
    
    const updatedEmbed = new EmbedBuilder()
      .setTitle(message.embeds[0].title)
      .setDescription(message.embeds[0].description)
      .setColor('#3498db')
      .addFields(
        { 
          name: 'Options', 
          value: pollData.options.map((opt, index) => 
            `${index + 1}. ${opt} (${pollData.votes[index].length} votes)`
          ).join('\n') 
        },
        { 
          name: 'Limits', 
          value: message.embeds[0].fields[1].value 
        },
        { 
          name: 'End Time', 
          value: message.embeds[0].fields[2].value 
        }
      )
      .setFooter({ text: message.embeds[0].footer.text })
      .setTimestamp();

  
    if (message.embeds[0].image) {
      updatedEmbed.setImage(message.embeds[0].image.url);
    }

    await message.edit({
      embeds: [updatedEmbed],
      components: message.components
    });
  } catch (error) {
    console.error('Fail to update poll messages', error);
  }
}


async function endPoll(pollId, channel) {
  try {
    const pollData = activePolls.get(pollId);
    if (!pollData) return;

    
    let maxVotes = -1;
    let winners = [];
    
    pollData.votes.forEach((votes, index) => {
      if (votes.length > maxVotes) {
        maxVotes = votes.length;
        winners = [index];
      } else if (votes.length === maxVotes && maxVotes > 0) {
        winners.push(index);
      }
    });

  
    const message = await channel.messages.fetch(pollData.messageId);
    
   
    const resultEmbed = new EmbedBuilder()
      .setTitle(`📊 Poll Result: ${pollData.question}`)
      .setDescription(pollData.description)
      .setColor('#2ecc71')
      .addFields(
        { 
          name: 'Options and Results', 
          value: pollData.options.map((opt, index) => {
            const isWinner = winners.includes(index) && maxVotes > 0;
            return `${isWinner ? '🏆 ' : ''}${index + 1}. ${opt} (${pollData.votes[index].length} votes)`;
          }).join('\n') 
        },
        { 
          name: 'Result', 
          value: maxVotes > 0 
            ? `Win Options: ${winners.map(index => `「${pollData.options[index]}」`).join(', ')} (${maxVotes} votes)`
            : 'Nobody voted in this poll. QAQ' 
        },
        {
          name: 'Limits', 
          value: `Everyone can vote for ${pollData.multiple} times\nChangeable: ${pollData.change ? 'Yes' : 'No'}\nOld Members Only: ${pollData.limit ? 'Yes' : 'No'}`
        }
      )
      .setFooter({ text: `Vote ID: ${pollId} | Ended` })
      .setTimestamp();


    if (message.embeds[0].image) {
      resultEmbed.setImage(message.embeds[0].image.url);
    }

 
    await message.edit({
      embeds: [resultEmbed],
      components: [] 
    });

    activePolls.delete(pollId);
  } catch (error) {
    console.error('Fail to end a poll', error);
  }
}

function calculateEndTime(duration) {
  const now = Date.now();
  let timeToAdd = 0;

  switch (duration) {
    case '1hr':
      timeToAdd = 1 * 60 * 60 * 1000;
      break;
    case '12hr':
      timeToAdd = 12 * 60 * 60 * 1000;
      break;
    case '1d':
      timeToAdd = 24 * 60 * 60 * 1000;
      break;
    case '3d':
      timeToAdd = 3 * 24 * 60 * 60 * 1000;
      break;
    case '5d':
      timeToAdd = 5 * 24 * 60 * 60 * 1000;
      break;
    case '7d':
      timeToAdd = 7 * 24 * 60 * 60 * 1000;
      break;
    case '10d':
      timeToAdd = 10 * 24 * 60 * 60 * 1000;
      break;
    case '14d':
      timeToAdd = 14 * 24 * 60 * 60 * 1000;
      break;
    default:
      timeToAdd = 24 * 60 * 60 * 1000; 
  }

  return now + timeToAdd;
}

function createPollButtons(options, pollId) {
  const rows = [];
  const numOptions = options.length;
  const numRows = Math.ceil(numOptions / 5);

  for (let i = 0; i < numRows; i++) {
    const row = new ActionRowBuilder();
    
    for (let j = 0; j < 5; j++) {
      const optionIndex = i * 5 + j;
      if (optionIndex >= numOptions) break;
      
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`vote_${pollId}_${optionIndex}`)
          .setLabel(options[optionIndex])
          .setStyle(ButtonStyle.Primary)
      );
    }
    
    rows.push(row);
  }

  return rows;
}

client.on('ready', () => {
  activePolls.forEach((pollData, pollId) => {
    const timeLeft = pollData.endTime - Date.now();
    if (timeLeft > 0) {
      setTimeout(() => {
        const channel = client.channels.cache.get(pollData.channelId);
        if (channel) endPoll(pollId, channel);
      }, timeLeft);
    } else {
      activePolls.delete(pollId);
    }
  });
});

client.login(process.env.TOKEN);

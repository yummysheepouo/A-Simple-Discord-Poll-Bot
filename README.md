# A Simple Discord Poll Bot

This bot is a simple but powerful and flexible Discord bot for creating advanced polls in your server. It supports multiple voting options, time limits, member restrictions, vote changing, and more—all managed through easy-to-use slash commands.

<p align="center">
  <img src="https://img.shields.io/badge/discord.js-v14.14.1-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/node.js-%3E%3D18.0.0-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/license-MIT-orange?style=for-the-badge" />
</p>


### By reading this page, you agree to download, edit, and use the files legally with personal use ONLY

---

## ✨Features

- **Create Custom Polls:** Set your own question, description, options (up to 10), and attach an image.
- **Voting Restrictions:** Limit voting to members who have been in the server for more than 7 days.
- **Vote Changing:** Allow or disallow users to change their votes.
- **Multiple Votes:** Set how many options each member can vote for (1-10).
- **Timed Polls:** Choose poll duration from 1 hour up to 14 days.
- **Live Results:** Polls update in real-time as users vote.
- **End Polls Early:** End any poll before its scheduled time.
- **Result Embeds:** Results are displayed clearly with winners highlighted.

---

## 🛠️ Slashcommand Reference

### `/poll create`
Create a new poll.

**Options:**
- `question` (string, required): The poll question or topic.
- `description` (string, required): Details about the poll.
- `option` (string, required): Poll options, separated by commas (e.g., `Alice,Bob,Charlie`).
- `limit` (choice, required): Restrict voting to members joined >7 days? (`Yes`/`No`)
- `duration` (choice, required): How long the poll lasts (`1hr`, `12hr`, `1d`, `3d`, `5d`, `7d`, `10d`, `14d`)
- `change` (choice, required): Allow members to change their votes? (`Yes`/`No`)
- `multiple` (integer, required): Max number of votes per member (1-10)
- `image` (string, optional): Image URL for the poll

### `/poll end`
End a poll by its ID.

**Options:**
- `id` (string, required): The poll ID (shown in the poll embed footer)

---

## Permissions Needed

- **User**: Only users with the Administrator permission can create or end polls.
- **Bot**: The bot needs permission to send & edit messages, embed links, and manage messages in the channel where polls are posted.


## Installation Guide

1. **Clone the Repository**
   ```sh
   git clone https://github.com/yummysheepouo/A-Simple-Discord-Poll-Bot.git
   cd A-Simple-Discord-Poll-Bot
   ```
   - OR just simply download the `index.js`

2. **Create a Discord Bot Application**
   - Go to the [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application and add a bot user.
   - Copy the bot token.

3. **Set Up Environment Variables**
   - Add the token to your variable file `.env`:
     ```
     TOKEN=YOUR_BOT_TOKEN_HERE
     ```

4. **Invite the Bot to Your Server**
   - Use the OAuth2 URL Generator in the Developer Portal.
   - Select `bot` and `applications.commands` scopes.
   - Grant the bot Administrator or appropriate permissions.

---

## Step-by-Step Setup Node.js

1. **Install Node.js**
   ```bash
   # Install Node.js (Ubuntu)
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   # Install Node.js (download from internet)
   https://nodejs.org/en
   ```

2. **Install Discord.js and required modules**
   ```bash
   npm install discord.js@14 dotenv
   ```

3. **Run the Bot**
   ```sh
   node index.js
   ```

---

## Important Notes

- **Poll IDs** are shown in the footer of each poll embed. Use these IDs to end polls.
- **Polls are not persistent** across bot restarts unless you implement your own storage.
- **Only administrators** can create or end polls.
- **Maximum 10 options** per poll.
- **Vote limits** and restrictions are enforced per user.
- **Images** must be URLs.

---

For issues or feature requests, please open an issue on the [GitHub repository](https://github.com/yummysheepouo/A-Simple-Discord-Poll-Bot) or contact me via Discord: yummysheep.



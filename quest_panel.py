# quest_panel.py
import discord
import math
import asyncio
import leveling_data  # Multiplier yahan se aayega
from discord.ui import View, Select, Modal, TextInput, Button
from config import (
    CATEGORY_TICKET_ID,
    ROLE_OWNER,
    ROLE_MODERATOR,
    ROLE_STAFF,
    TICKET_PREFIX,
)
from quests_data import QUESTS

# ---------- Utilities ----------
QUEST_NAMES = sorted(QUESTS.keys(), key=lambda s: s.lower())

def calc_total(selected_names):
    total_pkr = 0
    total_usd = 0.0
    multiplier = getattr(leveling_data, 'PRICE_MULTIPLIER', 1.0)
    
    for name in selected_names:
        pkr, usd_raw = QUESTS.get(name, (0, 0.0))
        
        # USD price ko clean karein (String to Float conversion)
        if isinstance(usd_raw, str):
            usd = float(usd_raw.replace("$", "").replace(",", "").strip())
        else:
            usd = float(usd_raw)
            
        total_pkr += int(pkr * multiplier)
        total_usd += round(usd * multiplier, 2)
        
    return total_pkr, round(total_usd, 2)

# ---------- Search Modal ----------
class SearchQuestModal(discord.ui.Modal, title="Search for a Quest"):
    query = discord.ui.TextInput(
        label="Quest Name", 
        placeholder="Enter quest name (e.g. Desert Treasure)", 
        min_length=2, 
        required=True
    )

    def __init__(self, parent_view):
        super().__init__()
        self.parent_view = parent_view

    async def on_submit(self, interaction: discord.Interaction):
        search_term = self.query.value.lower()
        matches = [name for name in QUEST_NAMES if search_term in name.lower()]
        
        if not matches:
            await interaction.response.send_message(f"❌ No quests found matching '{self.query.value}'.", ephemeral=True)
            return

        self.parent_view.filtered_list = matches
        self.parent_view.page = 0  
        self.parent_view._update_select_for_page()
        
        await interaction.response.edit_message(
            content=f"🔍 Search results for: **{self.query.value}**", 
            view=self.parent_view
        )

# ---------- RSN Modal ----------
class RSNModal(discord.ui.Modal, title="Enter your RuneScape Name (RSN)"):
    rsn = discord.ui.TextInput(label="RSN",
                               placeholder="Your RuneScape username",
                               max_length=32)

    def __init__(self, user: discord.User):
        super().__init__()
        self.user = user

    async def on_submit(self, interaction: discord.Interaction):
        view = QuestSelectionView(self.user, self.rsn.value)
        embed = discord.Embed(
            title="Select Quests",
            description="Use the dropdown to select quests. Use arrows to paginate or Search to find a specific quest.",
            color=discord.Color.blurple(),
        )
        await interaction.response.send_message(embed=embed, view=view, ephemeral=True)

# ---------- Quest Selection View ----------
class QuestSelectionView(discord.ui.View):
    def __init__(self, user: discord.User, rsn: str, *, timeout=300):
        super().__init__(timeout=timeout)
        self.user = user
        self.rsn = rsn
        self.page = 0
        self.per_page = 25
        self.selected = []
        self.filtered_list = QUEST_NAMES 
        self._update_select_for_page()
        
        self.add_item(PrevPageButton(self))
        self.add_item(NextPageButton(self))
        self.add_item(SearchButton(self))
        self.add_item(ResetSearchButton(self))
        self.add_item(ConfirmOrderButton(self))

    def _update_select_for_page(self):
        for child in list(self.children):
            if isinstance(child, discord.ui.Select):
                self.remove_item(child)
        
        start = self.page * self.per_page
        page_items = self.filtered_list[start:start + self.per_page]
        
        multiplier = getattr(leveling_data, 'PRICE_MULTIPLIER', 1.0)
        
        options = []
        for name in page_items:
            pkr_base, usd_base_raw = QUESTS[name]
            
            # Dropdown ke liye bhi USD clean karein
            if isinstance(usd_base_raw, str):
                usd_base = float(usd_base_raw.replace("$", "").replace(",", "").strip())
            else:
                usd_base = float(usd_base_raw)

            pkr_price = int(pkr_base * multiplier)
            usd_price = round(usd_base * multiplier, 2)
            
            options.append(discord.SelectOption(
                label=name, 
                description=f"PKR {pkr_price} • USD ${usd_price}"
            ))
        
        select = QuestSelect(options)
        select.callback = self.select_callback
        self.add_item(select)

    async def select_callback(self, interaction: discord.Interaction):
        values = interaction.data.get("values", []) if interaction.data else []
        start = self.page * self.per_page
        current_page_items = set(self.filtered_list[start : start + self.per_page])
        
        self.selected = [s for s in self.selected if s not in current_page_items]
        self.selected.extend(values)
        
        total_pkr, total_usd = calc_total(self.selected)
        embed = discord.Embed(title="Order Preview — Questing", color=discord.Color.green())
        embed.add_field(name="RSN", value=self.rsn)
        embed.add_field(name="Selected Quests", 
                        value="\n".join(self.selected) if self.selected else "No quests selected", 
                        inline=False)
        embed.add_field(name="Total Price", value=f"**PKR {total_pkr} • USD ${total_usd}**")
        await interaction.response.edit_message(embed=embed, view=self)

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        if interaction.user.id != self.user.id:
            await interaction.response.send_message("This is not your session.", ephemeral=True)
            return False
        return True

# ---------- UI Components ----------
class QuestSelect(discord.ui.Select):
    def __init__(self, options):
        super().__init__(placeholder="Select quests...", min_values=0, max_values=len(options), options=options)

class SearchButton(discord.ui.Button):
    def __init__(self, view):
        super().__init__(style=discord.ButtonStyle.secondary, label="🔍 Search", row=1)
        self.parent_view = view

    async def callback(self, interaction: discord.Interaction):
        await interaction.response.send_modal(SearchQuestModal(self.parent_view))

class ResetSearchButton(discord.ui.Button):
    def __init__(self, view):
        super().__init__(style=discord.ButtonStyle.danger, label="🔄 Reset", row=1)
        self.parent_view = view

    async def callback(self, interaction: discord.Interaction):
        self.parent_view.filtered_list = QUEST_NAMES
        self.parent_view.page = 0
        self.parent_view._update_select_for_page()
        await interaction.response.edit_message(content="Showing all quests.", view=self.parent_view)

class PrevPageButton(discord.ui.Button):
    def __init__(self, view):
        super().__init__(style=discord.ButtonStyle.secondary, label="◀", row=1)
        self.parent_view = view
    async def callback(self, interaction: discord.Interaction):
        if self.parent_view.page > 0:
            self.parent_view.page -= 1
            self.parent_view._update_select_for_page()
            await interaction.response.edit_message(view=self.parent_view)
        else:
            await interaction.response.defer()

class NextPageButton(discord.ui.Button):
    def __init__(self, view):
        super().__init__(style=discord.ButtonStyle.secondary, label="▶", row=1)
        self.parent_view = view
    async def callback(self, interaction: discord.Interaction):
        max_page = math.ceil(len(self.parent_view.filtered_list) / self.parent_view.per_page) - 1
        if self.parent_view.page < max_page:
            self.parent_view.page += 1
            self.parent_view._update_select_for_page()
            await interaction.response.edit_message(view=self.parent_view)
        else:
            await interaction.response.defer()

# ---------- Confirm Order ----------
class ConfirmOrderButton(discord.ui.Button):
    def __init__(self, parent_view):
        super().__init__(style=discord.ButtonStyle.success, label="✅ Confirm Order", row=2)
        self.parent_view = parent_view

    async def callback(self, interaction: discord.Interaction):
        if not self.parent_view.selected:
            await interaction.response.send_message("Select at least one quest!", ephemeral=True)
            return

        guild = interaction.guild
        author = interaction.user
        ticket_name = f"{TICKET_PREFIX}-{author.name.lower()}".replace(" ", "-")
        
        # Ticket duplicate prevention
        existing = discord.utils.get(guild.text_channels, name=ticket_name)
        counter = 1
        while existing:
            ticket_name = f"{TICKET_PREFIX}-{author.name.lower()}-{counter}"
            existing = discord.utils.get(guild.text_channels, name=ticket_name)
            counter += 1

        overwrites = {
            guild.default_role: discord.PermissionOverwrite(view_channel=False),
            author: discord.PermissionOverwrite(view_channel=True, send_messages=True, read_messages=True),
        }

        for role_id in (ROLE_OWNER, ROLE_MODERATOR, ROLE_STAFF):
            role = guild.get_role(role_id)
            if role:
                overwrites[role] = discord.PermissionOverwrite(view_channel=True, send_messages=True, read_messages=True)

        category = guild.get_channel(CATEGORY_TICKET_ID) if CATEGORY_TICKET_ID else None
        ticket = await guild.create_text_channel(name=ticket_name, overwrites=overwrites, category=category)

        # Build itemized list with Multiplier
        multiplier = getattr(leveling_data, 'PRICE_MULTIPLIER', 1.0)
        itemized_details = ""
        for name in self.parent_view.selected:
            pkr, usd_raw = QUESTS.get(name, (0, 0.0))
            if isinstance(usd_raw, str):
                usd = float(usd_raw.replace("$", "").replace(",", "").strip())
            else:
                usd = float(usd_raw)
            
            m_pkr = int(pkr * multiplier)
            m_usd = round(usd * multiplier, 2)
            itemized_details += f"✅ **{name}**: {m_pkr} PKR (${m_usd})\n"

        total_pkr, total_usd = calc_total(self.parent_view.selected)
        
        embed = discord.Embed(title="🎟️ New Questing Order", color=discord.Color.gold())
        embed.add_field(name="User", value=author.mention, inline=True)
        embed.add_field(name="RSN", value=self.parent_view.rsn, inline=True)
        embed.add_field(name="Selected Quests & Rates", value=itemized_details, inline=False)
        embed.add_field(name="Grand Total", value=f"**{total_pkr} PKR • USD ${total_usd}**", inline=False)
        embed.set_footer(text="Staff: Use the buttons below to manage the ticket.")

        from main import TicketControlView
        view = TicketControlView(author)
        
        # Staff Notification in English
        staff_tag = f"<@&{ROLE_STAFF}> <@&{ROLE_MODERATOR}> <@&{ROLE_OWNER}>"
        await ticket.send(content=f"{staff_tag} — **New order alert!** {author.mention} has opened a ticket.", embed=embed, view=view)
        await interaction.response.send_message(f"Ticket created: {ticket.mention}", ephemeral=True)

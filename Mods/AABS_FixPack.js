/*:
* =============================================================================================
* @plugindesc v1.00 - A pack of bug fixes for Alpha ABS. Place this plugin UNDER Alpha ABS on
* the Plugin Manager.
* @author SMO
*
* @param All Ammo A
* @type boolean
* @on YES
* @off NO
* @desc Do you want to see all the ammo available on the firearm
* panel? Default: NO
* @default false
*
* @param All Ammo B
* @type boolean
* @on YES
* @off NO
* @desc Do you want to see all the ammo available next to the
* weapon's icon? Default: YES
* @default true
*
* @help
*==============================================================================
* AABS_FixPack.js
*==============================================================================
* This plugin is just a mod for an already finished plugin (Alpha ABS), created
* by Pheonix KageDesu.
*
* You can find more of KageDesu's work on:
* https://github.com/KageDesu
*------------------------------------------------------------------------------
* What build is this plugin recommended for?
*
* The bug fixing is focused on 1128, but bugs on later builds may also be
* fixed by this plugin.
*------------------------------------------------------------------------------
* What bugs does this plugin fix?
*
* - Game Crashes
*    When loading a saved game you could come across one of the messages:
*    "Cannot read property 'concat' of undefined" or "Cannot read property 
*   'inBattle' of undefined". Loading a game saved before the build 1190 on
*    a build above 1190 would also crash the game.
*
* - FPS drop
*   The spell panel used to cause a considerable drop of FPS on certain
*   computers, and so did adding/removing party members on ABS maps.
*
* - Bush effect not working;
*
* - Summoning's ballon stuck on screen after unsummon and summoning never
*   comming back after using "Recover All";
*
* - Firearm "unloads" after transfering through ABS maps and ammo disappears
*   when reloading if the player is full of ammo.
*
* - Preview-target edible to use on deactivated enemies;
*
* - Player's movement speed stuck on lower or highers values after death;
*
* - Skills' parameters don't refresh on old saved games;
*
* - Not being able to add party members on ABS maps on build 1190+;
*
* - Adding an offset to a motionX also affect animations and enemies with 
*   multiple motionX skills may cause a bug where a new image will be asked 
*   on img/characters.
*------------------------------------------------------------------------------
* Does this plugin add something to it or is it just bug fixes?
* I'm glad you asked!
*
* REPOSITIONING THE TARGET CIRCLE
* You can reposition the target circle using notetags:
*
* <tCircleXOffSet:x> -> adds an offset of x pixels on the X axis;
* <tCircleYOffSet:x> -> adds an offset of x pixels on the Y axis;
*
* Where "x" is the amount of pixels you want to realocate it, write these
* on the enemies' note and everytime you select it on map the target circle
* will be repositioned.
*
* REPOSITIONING THE <ABS:1> SKILL'S VECTORS
* This will reposition the vector in the momment it's launched, to do so
* use the notetag:
*
* <vectorOffSetY:x> -> adds an offset of x pixels on the Y axis, but only if
* the player is facing left or right;
*
* This notetag may be written on the skill's note, on the actor's note or on
* the enemy's note (in case this is a skill for an enemy). If you write it
* on the skill's note and on the actor's note, both offsets will be added to
* the vector's sprite.
*
*------------------------------------------------------------------------------
* Changelog:
*
* V 1.00 
*   - Plugin released;
*
*------------------------------------------------------------------------------
* END OF THE HELP FILE
*------------------------------------------------------------------------------
*/

var Imported = Imported || {};

if (Imported.AlphaABS){
Imported.AABS_FixPack = true;
var AABS = AABS || {};
AABS.FP = {};
AABS.FP.version = 1.00;

AABS.Param = PluginManager.parameters('AABS_FixPack');
AABS.FP.showAllAmmoA = AABS.Param['All Ammo A'] === 'true' ? true : false;
AABS.FP.showAllAmmoB = AABS.Param['All Ammo B'] === 'true' ? true : false;

//-----------------------------------------------------------------------------------------------
//#FEATURE
//Adding an offset to the target's circle

AABS.FP._SpriteCharacterABS__setupSelection = AlphaABS.LIBS.Sprite_CharacterABS.prototype._setupSelection;
AlphaABS.LIBS.Sprite_CharacterABS.prototype._setupSelection = function(){
	AABS.FP._SpriteCharacterABS__setupSelection.call(this);
	if (this._character.battler()){
		var enemyId = this._character.battler()._enemyId;
		var enemy = $dataEnemies[enemyId];
		var xOffSet = Number(enemy.meta.tCircleXOffSet) || 0;
		var yOffSet = Number(enemy.meta.tCircleYOffSet) || 0;
		this._absParams.spriteSelect.x += Math.ceil(xOffSet);
		this._absParams.spriteSelect.y += Math.ceil(yOffSet);
	}
};

//-----------------------------------------------------------------------------------------------
//#FEATURE
//Adding an offset to <ABS:1> skill's vectors

ABSSkillLoader.PARAMS.push('vectorOffSetY');
AABS.FP._Game_SVector_update = AlphaABS.LIBS.Game_SVector.prototype.update;
AlphaABS.LIBS.Game_SVector.prototype.update = function(){
	AABS.FP._Game_SVector_update.call(this);
	if (this.sprite && this._started) {
		var ep = this._endPoint();
		var a = ep.screenY() - this.sprite.y + this._offsetY + 2;
		var b = ep.screenX() - this.sprite.x;
		var angle = Math.atan2(a, b);
		this.sprite.rotation = angle;
	}
};

AlphaABS.LIBS.Game_SVector.prototype._imageToPoint = function(){
	if (this._offsetY === undefined){
		this._offsetY = this.getOffset();
	}
	if(this._myPoint == null) return;
	var x = this._myPoint.screenX();
	var y = this._myPoint.screenY() + this._offsetY;
	this.sprite.x = x;
	this.sprite.y = y;
};

AlphaABS.LIBS.Game_SVector.prototype.getOffset = function(){
	var subject = this._data.subject;
	var offset = 0;
	if (subject && this.isFacingHorz() && subject._absParams){
		offset += this._data.skill.vectorOffSetY;    //skill's notetag
		var battler = subject._absParams.battler;
		var meta = (battler instanceof Game_Actor) ? $dataActors[battler._actorId].meta : 
			$dataEnemies[battler._enemyId].meta;
		if (Number(meta.vectorOffSetY)) offset += Number(meta.vectorOffSetY); //battler's notetag
	}
	return offset;
};

AlphaABS.LIBS.Game_SVector.prototype.isFacingHorz = function(){
	return [4, 6].contains(this._data.subject._direction);
};

//-----------------------------------------------------------------------------------------------
//#FIX
//Fixed game crashes after loading
//
//This function could return "null" so using $gameTroop.membersABS().concat would crash
//the game

Game_Troop.prototype.membersABS = function () {
	return this._enemiesABS || [];
};

//-----------------------------------------------------------------------------------------------
//#FIX
//Reactivating the bush effect

if (AlphaABS.Build >= 1128 && AlphaABS.Build <= 1164){
	AABS.FP._SpriteCharacter_updateOther = Sprite_Character.prototype.updateOther;
	Sprite_Character.prototype.updateOther = function(){
		this.opacity = this._character.opacity();
		this.blendMode = this._character.blendMode();
		this._bushDepth = this._character.bushDepth();
		AABS.FP._SpriteCharacter_updateOther.call(this);
	};
}

//-----------------------------------------------------------------------------------------------
//#FIX
//Removing summonings' balloon after it's unsummoned

if (AlphaABS.Build >= 1076 && AlphaABS.Build <= 1174){
	AABS.FP._SpritesetMap_removeSpawnEventABS = Spriteset_Map.prototype.removeSpawnEventABS;
	Spriteset_Map.prototype.removeSpawnEventABS = function(id){
		var event = $gameMap.event(id);
		var sprite = this.getSpriteForCharacter(event);
		if (sprite){
			if (sprite._balloonSprite){
				event.endBalloon();
				sprite.endBalloon();
			}
			AABS.FP._SpritesetMap_removeSpawnEventABS.call(this, id);
		}
	};
}

//-----------------------------------------------------------------------------------------------
//#FIX
//Restoring stack after transfer

if (AlphaABS.Build >= 1128 && AlphaABS.Build <= 1150){
	//Getting the stack (ammo on the magazine) before transfer
	AABS.FP._GameInterpreter_command201 = Game_Interpreter.prototype.command201;
	Game_Interpreter.prototype.command201 = function () {
		if (AlphaABS.Parameters.get_AllowTransferState() == true && $gameMap.isABS()) {
			var skill = $gameParty.leader()._firstBattleABSSkill();
			if (skill.isFirearm()) {
				$gamePlayer._transferReloadStack = skill._currentStack || 0;
			}
		}
		AABS.FP._GameInterpreter_command201.call(this);
	};

	//Restoring stack
	AABS.FP._GamePlayer_clearTransferInfo = Game_Player.prototype.clearTransferInfo;
	Game_Player.prototype.clearTransferInfo = function () {
		AABS.FP._GamePlayer_clearTransferInfo.call(this);
		if (this._transferReloadStack && $gameMap.isABS()) {
			$gameParty.leader()._firstBattleABSSkill().restoreStack(this._transferReloadStack);
			this._transferReloadStack = 0;
		}
	};

	Game_SkillABS.prototype.restoreStack = function (count) {
		if (!this.isFirearm()) return;
			var ammo = $dataItems[this.ammo];
			$gameParty.loseItem(ammo, count);
			this._currentStack = count;
		if (this._currentStack > 0) {
			this.resetCast();
			this._stackNeedReload = false;
		} else {
			this._stackNeedReload = true;
		}
		if(this._currentStack == null)
			this._currentStack = 0;
	};
}

//Avoiding to give extra ammo for the player
AABS.FP._GameActor_unloadFirearm = Game_Actor.prototype.unloadFirearm;
Game_Actor.prototype.unloadFirearm = function () {
	var skill = $gameParty.leader()._firstBattleABSSkill();
	skill._currentStack = 0;
	AABS.FP._GameActor_unloadFirearm.call(this);
};

//The ammo on stack now counts for the maximun ammo
//E.G. If your max ammo is 99 and you have 30 on the magazine you can only have 69 on the inventory
AABS.FP._GameParty_maxItems = Game_Party.prototype.maxItems;
Game_Party.prototype.maxItems = function(item){
	var maxItems = AABS.FP._GameParty_maxItems.call(this, item);

	//Check if "item" is the ammo for the current weapon
	var skill = $gameParty.leader()._firstBattleABSSkill();
	if (skill.isFirearm() && skill.ammo === item.id){
		var stack = skill._currentStack > -1 ? skill._currentStack : skill.stack;
		maxItems -= stack;
		maxItems = maxItems > 0 ? maxItems : 0;
	}

	return maxItems;
};

//Showing all the ammo on the panel
if (AABS.FP.showAllAmmoA){
	AlphaABS.LIBS.UIObject_FirearmPanel.prototype._drawWeaponInfo = function(){
		var ammoItem;
		ammoItem = $dataItems[this._absSkill.ammo];
		if (ammoItem == null) {
			return;
		}
		this._drawIcon(ammoItem.iconIndex);
		this._drawAmmoCount($gameParty.numItems(ammoItem) + this._absSkill._currentStack);
		return this._drawChargesCount(this._absSkill._currentStack, this._absSkill.stack);
	};
}

//Showing all the ammo next to the ammo's icon
if (AABS.FP.showAllAmmoB){
	AlphaABS.LIBS.AAWeaponIconManagerNew.prototype._drawAmmoCount = function(ammoId){
		var skill = $gameParty.leader()._firstBattleABSSkill();
		var stack = skill.isFirearm() ? skill._currentStack : 0;
		var count = $gameParty.numItems($dataItems[ammoId]) + stack;
		if (count === 0) {
			return this._weaponSprite.drawText2Disabled(0);
		} else {
			return this._weaponSprite.drawText2Special(count);
		}
	};
}

//-----------------------------------------------------------------------------------------------
//#FIX
//Removing summining from map after using "Recover All"
//
//Usually, when the summon state is removed (faded or forced), the summoning is also removed,
//but when the states are cleared through "Recover All" it didn't

AABS.FP._Game_Actor_clearStates = Game_Actor.prototype.clearStates;
Game_Actor.prototype.clearStates = function(){
	AABS.FP._Game_Actor_clearStates.call(this);
	if ($gameParty.leader() === this && uAPI.isSummonUnitExist){
		$gameParty.leader()._onSummonStateRemoved();
	}
};

//-----------------------------------------------------------------------------------------------
//#FIX
//Fixed crash after loading

if (AlphaABS.Build <= 1190){
	AABS.FP._Game_Player_onGameLoad = Game_Player.prototype.onGameLoad;
	Game_Player.prototype.onGameLoad = function(){
		if (!this._absParams) this._initMembersABS();
		AABS.FP._Game_Player_onGameLoad.call(this);
	};
}

//-----------------------------------------------------------------------------------------------
//#FIX
//Preview won't work on deactivated enemies

if (AlphaABS.Build >= 1194){
	AABS.FP._AA_BattleUI_previewTarget = AA.BattleUI.previewTarget;
	AA.BattleUI.previewTarget = function(target){
		if (target && target.inActive()){
			AABS.FP._AA_BattleUI_previewTarget.call(this, target);
		}
	};
}

//-----------------------------------------------------------------------------------------------
//#FIX
//Resetting the player's speed when he's deactivated

if (AlphaABS.Build <= 1174){
	AABS.FP._GamePlayer__deactivate = Game_Player.prototype._deactivate;
	Game_Player.prototype._deactivate = function () {
		this.battler()._absParams.moveSpeedUpKoef = 0;
		AABS.FP._GamePlayer__deactivate.call(this);
	};
}

//-----------------------------------------------------------------------------------------------
//#FIX
//Cleaning the party after loading a game from before 1190 on a build above 1190
//
//Since build 1194 Game_AI2Bot does not exist anymore, so loading games where the party members
//were made using it as constructor will crash

if (AlphaABS.Build >= 1194){
	AABS.FP._DataManager_extractSaveContents = DataManager.extractSaveContents;
	DataManager.extractSaveContents = function(contents) {
		var followers = contents.player._followers._data;
		if (followers.length > 0 && !followers[0].onGameLoad){
			contents.player._followers._data = [];
		}
		AABS.FP._DataManager_extractSaveContents.call(this, contents);
	};
}

//-----------------------------------------------------------------------------------------------
//#FIX
//Refreshing skills on saved games
//
//If you change a skill on the database and load a previous saved game, the changes on that skill
//are not applied because AABS does not recreate the "ABS Skill" object, so here I'm forcing
//an update for the skills of all the actors (only when loading an old version of the game)

AABS.FP._SceneLoad_reloadMapIfUpdated = Scene_Load.prototype.reloadMapIfUpdated;
Scene_Load.prototype.reloadMapIfUpdated = function() {
	AABS.FP._SceneLoad_reloadMapIfUpdated.call(this);
	$gameActors._data.forEach(function(a){
		if (a) a.reloadABSSkills();
	});
};

Game_Actor.prototype.reloadABSSkills = function(){
	var skills = this._absParams.battleSkillsABS._skillsABS;
	var panelSkills = this._absParams.panelSkills;
	var panelSlots = panelSkills.map(s => !!s);
	var id, isItem, isCooldown, find, cooldown = 0;

	//Looping through all the ABS skills and items that this actor currently has
	for (var s = 0; s < skills.length; s++){
		if (skills[s]){
			id = skills[s].skillId;                            //skill/item id
			isItem = skills[s]._isItem;                        //is this an item?
			cooldown = skills[s].timer._value;                 //timer's current value
			isCooldown = cooldown != skills[s].timer._mValue;  //is there a cooldown active?

			//If this is a skill and it's not learned, learn it
			if (!isItem && !this.isLearnedSkill(id) && id != 1){
				this.learnSkill(id);
			}

			//Recreating the skill/item's data
			skills[s] = new Game_SkillABS(id, isItem);

			//Restoring cooldown
			if (isCooldown){
				var reloadParam = skills[s].reloadParam ? 
					this._calculateABSSkillReloadParam(skills[s].reloadParam) : 0;
				skills[s].preUse(reloadParam);
				skills[s].timer.start(skills[s].reloadTimeA);
				skills[s].timer._value = Math.min(cooldown, skills[s].timer._mValue);
			}
		}
	}

	//Refreshing the skills on the skill panel
	for (var p = 0; p < panelSkills.length; p++){
		if (panelSkills[p]){
			if (panelSlots[p]){
				id = panelSkills[p].skillId;
				isItem = panelSkills[p]._isItem;
				find = skills.find(s => id === s.skillId && isItem === s._isItem);
				panelSkills[p] = find || null;
			} else {
				//There's a skill on index "p" but it was not there before, so erase it
				panelSkills[p] = null;
			}
		}
	}
};

//-----------------------------------------------------------------------------------------------
//#FIX
//Fixing FPS drop caused by the spell panel

if (AlphaABS.Build <= 1200){
	AA.LIBS.SpriteSpellPanelItem.prototype._createTextSprite = function() {
		this._textSpr = AASprite.FromBitmap(this.settings.textZoneWidth, this.settings.textZoneHeight);
		this.applyTextSettingsByJson(this._textSpr, this.settings);
		this._textSpr.bitmap.outlineColor = '#000000';
		this._textSpr.bitmap.outlineWidth = 2;
		return this.add(this._textSpr);
	};

	AA.LIBS.SpriteSpellPanelItem.prototype._createText2Sprite = function(){
		this._textSpr2 = AASprite.FromBitmap(this.settings.text2ZoneWidth, this.settings.text2ZoneHeight);
		this.applyTextSettingsByExtraSettings(this._textSpr2, this.settings.text2);
		this._textSpr2.bitmap.outlineColor = '#000000';
		this._textSpr2.bitmap.outlineWidth = 2;
		return this.add(this._textSpr2);
	};
}

//-----------------------------------------------------------------------------------------------
//#FIX
//Fixing FPS drop when changing party members

AABS.FP._BattleManagerABS_updateABSSession = AlphaABS.BattleManagerABS.updateABSSession;
AlphaABS.BattleManagerABS.updateABSSession = function(){
	var Scene = SceneManager._scene;
	var spriteset = Scene._spritesetUI;
	var sprites = spriteset.children;
	var remove = [];
	remove = sprites.filter(function(s){
		if (!(s instanceof AlphaABS.LIBS.UI_SelectCircleFW)){
			if (!(s instanceof AlphaABS.LIBS.Sprite_XButton)){
				return true;
			}
		}
		return false;
	});
	for (var r = 0; r < remove.length; r++){
		spriteset.removeChild(remove[r]);
	}
		
	//Saving with the inventory button's visibility
	var inventory_button = Scene.sceneButtonSystem._buttons.find(b => b.buttonName === 'inventory');
	var inventory_visible = inventory_button ? inventory_button.visible : false;

	AABS.FP.isSwap = true;
	AABS.FP._BattleManagerABS_updateABSSession.call(this);
	AABS.FP.isSwap = false;
	
	//Refreshing gamepad's buttons
	$gamePlayer._refreshGamePadCommands();

	//Restoring the inventory button's original visibility
	if (inventory_button){
		inventory_button.visible = inventory_visible;
	}
};

//For compatibility with the gamepad
AlphaABS.LIBS.Spriteset_InterfaceABS.prototype.initABS = function(){
	var isRecentBuild = AlphaABS.Build >= 1190;
	this._isABS = true;
	this._createElements();
	this._createUIContainers();
	if (isRecentBuild){
		this._createPartyUI();
	} else {
		this._refreshPlacement();
	}
	this.createSpellPanel();
	if (!this._showUI) {
		this.hide();
	} else {
		if (isRecentBuild && this._needFree) {
          this.freeElements();
          this._needFree = false;
        } else {
            this.show();
        }
	}
	if (AA.isPro() && Input.isGamepad() && !AABS.FP.isSwap) {
		$gamePlayer.onGamePadConnected();
		this._gamepadUI = new AA.LIBS.GamePadUI(this);
		if (!this._showUI || $gameVariables.getUIParam('uiButtonHided') == true) {
			this._gamepadUI._hidden = true;
		}
	}
	if (isRecentBuild){
		this.refreshPlayerABGaugeAndIcon();
		this._onEndCreate();
	}
};

//-----------------------------------------------------------------------------------------------
//#FIX
//Fixing not being able to add a party members in ABS maps

if (AlphaABS.Build >= 1190){
	AABS.FP._Game_Party_addActor = Game_Party.prototype.addActor;
	Game_Party.prototype.addActor = function (actorId) {
		var newABSMember = null;
		if (!this._actors.contains(actorId)) {
			this._actors.push(actorId);
			$gamePlayer.refresh();
			$gameMap.requestRefresh();
			if (AlphaABS.isABS()){
				var followers = $gamePlayer.followers();
				newABSMember = new AIAlly(followers._data.length + 1);
				followers._data.push(newABSMember);
				if(!followers._data[followers._data.length - 1].reInitABS){
					followers._data[followers._data.length - 1].reInitABS = function(){};
				};
				newABSMember.locate($gamePlayer.x, $gamePlayer.y);
			}
		}
		AABS.FP._Game_Party_addActor.call(this, actorId);
		if (newABSMember){
			var spriteset = SceneManager._scene._spriteset;
			var playerSprIndex = spriteset.getCharSpriteIndex($gamePlayer);
			if (playerSprIndex > -1){
				var sprite = new Sprite_CharacterABS(newABSMember, 2);
				spriteset._characterSprites.splice(playerSprIndex, 0, sprite);
				spriteset._characterSpritesABS.splice(playerSprIndex, 0, sprite);
				spriteset._tilemap.addChild(sprite);
			}
		}
	};
}

AABS.FP._Game_Party_removeActor = Game_Party.prototype.removeActor;
Game_Party.prototype.removeActor = function (actorId) {
	var isABSChange = AlphaABS.isABS() && this._actors.contains(actorId);
	var isRecentBuild = AlphaABS.Build >= 1190;
	if (isABSChange){
		var removedIndex = this._actors.indexOf(actorId);
		var spriteset = SceneManager._scene._spriteset;
		var spriteIndex = spriteset.getCharSpriteIndex($gamePlayer.followers()._data[removedIndex - 1]);
		spriteset._tilemap.removeChild(spriteset._characterSprites[spriteIndex]);
		spriteset._characterSprites.splice(spriteIndex, 1);
		spriteset._characterSpritesABS.splice(spriteIndex, 1);
		if (isRecentBuild){
			$gamePlayer.followers()._data.splice(removedIndex - 1, 1);
		}
		for (var a = 1; a < this._actors.length; a++){
			SlowUpdateManager.clear(900 + a);
		}
		$gamePlayer._followers._removingActor = true;
	}

	AABS.FP._Game_Party_removeActor.call(this, actorId);
	if (isABSChange){
		for (var a = 0; a < $gamePlayer.followers()._data.length; a++){
			var follower = $gamePlayer.followers()._data[a];
			var index = isRecentBuild ? follower._memberIndex : follower._absParams.partyIndex;
			if (!index && index != 0) continue;
			if (index > removedIndex){
				if (isRecentBuild){
					follower._memberIndex--;
				} else {
					follower._absParams.partyIndex--;
				}
			}
			var stateMachine = isRecentBuild ? follower._aaEntity._stateMachine : follower._stateMachine;
			var updateTime = AA.Parameters.get_AIUpdateTickTime() / 2;
			SlowUpdateManager.register(900 + index,  stateMachine, updateTime);
		}
	}
	$gamePlayer._followers._removingActor = false;
};


AABS.FP._Game_Followers_initializeABS = Game_Followers.prototype.initializeABS;
Game_Followers.prototype.initializeABS = function(){
	if (!this._removingActor){
		AABS.FP._Game_Followers_initializeABS.call(this);
	}
};


Spriteset_Map.prototype.getCharSpriteIndex = function(character){
	for (var s = 0; s < this._characterSprites.length; s++){
		var sprite = this._characterSprites[s];
		if (sprite && sprite._character === character){
			return s;
		}
	}
	return -1;
};

//-----------------------------------------------------------------------------------------------
//#FIX
//Motion's offsets will not influence the animations anymore (motionX)

AABS.FP._Sprite_Animation_updatePosition = Sprite_Animation.prototype.updatePosition;
Sprite_Animation.prototype.updatePosition = function(){
	AABS.FP._Sprite_Animation_updatePosition.call(this);
	if (this._absMode && !this._absModeMap && this._animation.position != 3){
		var target = this._target;
		var offset = 0;
		if (target._character.inAAnimMotion() && target._character.__AnimMotionReady == true) {
			offset += target._AAnimMotionOffset();
		} else if (target._character.inABSMotion()) {
			offset += target._absMotionOffset();
		}
		this.y -= offset;
	}
};

//-----------------------------------------------------------------------------------------------
//#FIX
//Enemies using more than one skill with motion system will not crash the game anymore (motionX)

AABS.FP._Sprite_Character_setCharacterBitmap = Sprite_Character.prototype.setCharacterBitmap;
Sprite_Character.prototype.setCharacterBitmap = function() {
	if (this.isMotionEnding()){
		this._character._characterName = this._character.__basicCN;
		this._character._characterIndex = this._character.__basicCI;
		this._characterName = this._character.__basicCN;
		this._characterIndex = this._character.__basicCI;
	}
	AABS.FP._Sprite_Character_setCharacterBitmap.call(this);
};

Sprite_Character.prototype.isMotionEnding = function(){
	if (this._character.__basicCN == null) return false;
	if (this._character === $gamePlayer) return false;
	if (this._character.inAAnimMotion()) return false;
	if (this._character.inABSMotion()){
		var motion = this._character.ABSParams().absMotion;
		if (!motion.isOldABSMotion()){
			return false;
		}
	}
	if (!this._character._absParams.active) return false;
	return true;
};

//-----------------------------------------------------------------------------------------------
} else { //Imported.AlphaABS
	console.error('Please, place AABS_FixPack beneath Alpha ABS on the Plugin Manager list.');
}

//===============================================================================================
// END
//===============================================================================================

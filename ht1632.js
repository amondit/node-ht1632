var SPI = require('pi-spi');


exports.mode = {
	8NMOS: 0x8400,
	16NMOS: 0x8480,
	8PMOS: 0x8500,
	16PMOS: 0x8580
};


exports.initialize = function (device, mode) {
	var _mode = 0x8500; //8PMOS
	if (arguments.length != 2 || (arguments.length != 1 && (typeof mode !== 'number')))
		throw new TypeError("Expected arguments : device, [mode]").
	
	var ht1632 = {};


	//Define HT1632 command and data messages
	//Note: to be used as unsigned 16b integers.

	var _commandLedOn 	= 0x8060; //1000000001100000
	var _commandLedOff 	= 0x8040; //1000000001000000
	var _commandSysEn 	= 0x8020; //1000000000100000
	var _commandSysDis 	= 0x8000; //1000000000000000
	var _commandBlinkOn 	= 0x8120; //1000000100100000
	var _commandBlinkOff = 0x8100; //1000000100000000
	var _commandMasterMode = 0x8280; //1000001010000000
	var _command8NMOS 	= 0x8400; //1000010000000000
	var _command16NMOS 	= 0x8480; //1000010010000000
	var _command8PMOS 	= 0x8500; //1000010100000000
	var _command16PMOS 	= 0x8580; //1000010110000000

	var _commandBasePWM 	= 0x9400; //1001010000000000
	var _commandPWMStep	= 32;
	var _commandPWMMaxStep = 15;
	var _command16PWM 	= 0x95E0; //1001010111100000

	var ht1632BaseWrite	= 0xA000 //"1010000000000000";
	var ht1632AddrIncr	= 64;

	var ht1632D0On		= 0x20 //"0000000000100000";
	var ht1632D1On		= 0x10 //"0000000000010000";
	var ht1632D2On		= 0x8 //"0000000000001000";
	var ht1632D3On		= 0x4 //"0000000000000100";


	var _blink = false;
	var _pwmLevel = 15;

	//Init SPI interface

	var spi = SPI.initialize(dev);
	spi.clockSpeed(2560000);

	var spiMessage = new Buffer(2);
	var spiMessageTransferErrorHandling = function(e,d){
		if (e) console.error(e);
	};


	//Commands to init HT1632 display

	spiMessage.writeUInt16BE(_commandSysDis,0);
	spi.write(spiMessage, spiMessageTransferErrorHandling);
	console.log("SysDis "+spiMessage.readUInt16BE().toString(2));
	spiMessage.writeUInt16BE(_mode,0);
	spi.write(spiMessage, spiMessageTransferErrorHandling);
	console.log("Mode "+spiMessage.readUInt16BE().toString(2));
	spiMessage.writeUInt16BE(_commandMasterMode,0);
	spi.write(spiMessage, spiMessageTransferErrorHandling);
	console.log("MasterMode "+spiMessage.readUInt16BE().toString(2));
	spiMessage.writeUInt16BE(_commandSysEn,0);
	spi.write(spiMessage, spiMessageTransferErrorHandling);
	console.log("SysEn "+spiMessage.readUInt16BE().toString(2));
	spiMessage.writeUInt16BE(_commandLedOn,0);
	spi.write(spiMessage, spiMessageTransferErrorHandling);
	console.log("LedOn "+spiMessage.readUInt16BE().toString(2));
	spiMessage.writeUInt16BE(_commandBasePWM+_commandPWMStep*_pwmLevel,0);>
	spi.write(spiMessage, spiMessageTransferErrorHandling);
	console.log(_pwmLevel+"PWM "+spiMessage.readUInt16BE().toString(2));
	spiMessage.writeUInt16BE(_commandBlinkOff,0);
	spi.write(spiMessage, spiMessageTransferErrorHandling);
	console.log("BlinkOff "+spiMessage.readUInt16BE().toString(2));
	

	ht1632.blink = function(enableBlinking) {
		if (arguments.length < 1) return _blink;
        else if (typeof enableBlinking === 'boolean') {
        	_blink = enableBlinking;
        	if (enableBlinking) {
				spiMessage.writeUInt16BE(_commandBlinkOn,0);
				spi.write(spiMessage, spiMessageTransferErrorHandling);
				console.log("BlinkOn "+spiMessage.readUInt16BE().toString(2));
			}else {
				spiMessage.writeUInt16BE(_commandBlinkOff,0);
				spi.write(spiMessage, spiMessageTransferErrorHandling);
				console.log("BlinkOff "+spiMessage.readUInt16BE().toString(2));
			};
        } 
        else throw TypeError("Blinking argument must be a boolean.");
		
	};
	
	ht1632.pwm = function (intensity) {
		if (arguments.length < 1) return _pwmLevel;
        else if (typeof intensity === 'number' && intensity >= 0 && intensity <= 15) {
        	_pwmLevel = intensity;
        	spiMessage.writeUInt16BE(_commandBasePWM+_commandPWMStep*_pwmLevel,0);
			spi.write(spiMessage, spiMessageTransferErrorHandling);
			console.log(_pwmLevel+"PWM "+spiMessage.readUInt16BE().toString(2));
        } 
        else throw TypeError("PWM level must be a number between 0 and 15.");
	};

	ht1632.writeAddress = function(offset, d0, d1, d2, d3) {
		if (arguments.length == 4 && (typeof offset === 'numeric') && (typeof d0 === 'boolean') && (typeof d1 === 'boolean') && (typeof d2 === 'boolean') && (typeof d3 === 'boolean')) {
			var writeCommand = ht1632BaseWrite+offset*ht1632AddrIncr;
			if (d0) { writeCommand = writeCommand+ht1632D0On};
			if (d1) { writeCommand = writeCommand+ht1632D1On};
			if (d2) { writeCommand = writeCommand+ht1632D2On};
			if (d3) { writeCommand = writeCommand+ht1632D3On};
			spiMessage.writeUInt16BE(writeCommand,0);
			spi.write(spiMessage, spiMessageTransferErrorHandling);
			console.log("Writing "+spiMessage.readUInt16BE().toString(2));
		}
        else throw TypeError("Invalid arguments, required : number: offset, boolean d0, boolean d1, boolean d2, boolean d3");
	};

	ht1632.clear = function() {
		var maxAddressOffset = 96;
		for (var i = 0; i < maxAddressOffset; i++) {
			ht1632.writeAddress(i, false ,false ,false , false);
		};
	};

	ht1632.findLeds = function() {
		var addressOffset = 0;
		var maxAddressOffset = 96;
		var currentLed = -1;

		var ledLoop = function(){
			currentLed++;
			if (currentLed == 4) {
				currentLed = 0;
				//switch off leds at previous address, before moving to next one
				ht1632.writeAddress(addressOffset, false ,false ,false , false);
				addressOffset++;
			};
			switch(currentLed) {
				case 0:
					ht1632.writeAddress(addressOffset, true ,false ,false , false);
					break;
				case 1:
					ht1632.writeAddress(addressOffset, false ,true ,false , false);
					break;
				case 2:
					ht1632.writeAddress(addressOffset, false ,false ,true , false);
					break;
				case 3:
					ht1632.writeAddress(addressOffset, false ,false ,false , true);
					break;
			}
			
		};

		var ledLoopQuestion = function(){
			var readline = require('readline');

			var rl = readline.createInterface({
				input: process.stdin,
				output: process.stdout
			});

			rl.question("Press enter to write to next LED address. ('exit' to exit) > ", function(answer) {
				switch(answer) {
					case 'exit':
					case 'quit':
						addressOffset = maxAddressOffset;
						break;
					default:
						break;
				}
				rl.close();
				ledLoop();
				if (addressOffset == maxAddressOffset) return;
				ledLoopQuestion();
				});
			};

		ledLoopQuestion();
		}
	
	return ht1632;

};

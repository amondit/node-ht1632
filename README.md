# node-ht1632

Simple Node.js library to communicate with a HT1632 LED controller chip using SPI. Uses the `pi-spi` asyncronous node.js SPI library for Raspberry Pi (and likely other embedded Linux platforms that provide /dev/spidevN.N).

It is intentionally low level (directly exposes the HT1632 RAM addresses to writing) to make it more compatible to the various implementations of LED displays that use this chip. For example, my hack of the WoodStation weather alarm clock uses such a LED controller, but not in the usual "Led Matrix" way, and uses leds in a "7 segment" layout.


## Example

`npm install ht1632`


```javascript
var HT1632 = require('ht1632');

var display = HT1632.initialize("/dev/spidev0.0", HT1632.mode.MODE_8NMOS);

// write led D1 at address 0x02
display.writeAddress(0x02, false, true, false, false);

// Sets the LED index 1 at address 0x02. Led index range is 0-3 as described in the datasheet.
display.writeLed(0x02, 1, true);

// Enable blinking
display.blink(true);

// Set PWM to 8 (range 0-15)
display.pwm(8);

// clear ht1632 ram 
display.clear();

// Enable prompt mode where all leds will consecutively be turned on.
// Useful to hack an existing display implementation.
display.findLeds();

```

Probably requires running node under `sudo` for SPI permissions, unless you've used [Wiring Pi's gpio utility](https://projects.drogon.net/raspberry-pi/wiringpi/the-gpio-utility/) or otherwise adjusted device permissions.

## API

### display = HT1632.initialize(device, [mode])

`device` will usually be "/dev/spidev0.0" or "/dev/spidev0.0". You will first need to enable the `spi-bcm2708` kernel module [e.g. these instructions](http://scruss.com/blog/2013/01/19/the-quite-rubbish-clock/#spi) or similar for your platform. As mentioned above, by default this device requires root permissions and so you'll either need to change this or run your script with according privilege.

`mode`, optional,  is either `HT1632.mode.8NMOS`, `HT1632.mode.16NMOS`, `HT1632.mode.8PMOS` or `HT1632.mode.8NMOS`depending on the LED layout (see HT1632 datasheet and/or the display one). Defaults to `HT1632.mode.8PMOS`.

### display.writeAddress(offset, d0, d1, d2, d3))

Sets the `d0`, `d1`, `d2` and `d3` LED bits at the `offset` address. LED bits values are boolean, and `offset` value is integer between 0 and 64 (8NMOS or 8PMOS mode) or 96 (16NMOS or 16PMOS mode) as per the HT1632 datasheet.

### display.writeLed(offset, ledIndex, value))

Sets the led of `ledIndex` at the `offset` address (led index range is 0-3 as described in the HT1632 datasheet). Value is boolean, and `offset` value is integer between 0 and 64 (8NMOS or 8PMOS mode) or 96 (16NMOS or 16PMOS mode) as per the HT1632 datasheet. Other led values at the same offset will stay the same.

### display.blink([enableBlinking])

Sets (or gets, if no argument provided) the hardware based blinking of the HT1632 display. Value is boolean.

### display.pwm([intensity])

Sets (or gets, if no argument provided) the hardware based PWM level of the HT1632 display. Value is number between 0 and 15 included.

### display.clear()

Clears all ram of the HT1632 controller. Effectively switches off all leds.

### display.findLeds()

Launches a loop that will cycle through all leds at all addresses of the HT1632 ram, turns it on and waits for user input at every step (`exit` or `quit` to stop).
Useful if diagnosing an existing display, to find which led is at what address.

## License

Copyright © 2015, Arnaud Mondit.
Licenced under MIT license.

# Monk's Chat Timer
Create a chat card to display a count down timer, allows you to either count up, or count down.  Display a message to the chat card, and send a followup message when the timer finishes.

## Installation
Simply use the install module screen within the FoundryVTT setup

## Usage & Current Features
***Requires the module Library: Chat Commands installed.***

![monks-chat-timer](/screenshots/example.png)

Enter a chat command to create a chat card with a timer

`/timer Number flavor:String followup:String`

> @param {Number}  The time to count in seconds.  Adding a negative value will count down to zero, otherwise it will count from zero up to the number.  You can also use time notation in case you want to specify something longer than seconds.
>
> @param {String}  A string to display in the chat card when it is created.  This is optional.  Leaving out this tag will consider any string after the time to be flavor
>
> @param {String} A followup string to display in a chat message when the timer completes.``

*Examples*
- `/timer 5` will add a timer that counts up 5 seconds
- `/timer -5` will count down 5 seconds
- `/timer 5:00 flavor:Send this message to the timer followup:Send this message after the timer is finished` will add a timer that counts up 5 minutes, displaying the first message in the chat message with the timer.  And once the timer it complete it will send a second chat message with the second message that's in parenthesis.

### Popout

You can also right cick on the chat card to pop it out in it's own window.  That way you can keep track of timers that are currently running.

## Monk's Little Details

This feature was previously part of the Monk's Little Details module, but was split out so that the modules were easier to maintain and could concentrate on the function they did best.

## Bug Reporting
Please feel free to contact me on discord if you have any questions or concerns. ironmonk88#4075

## Support

If you feel like being generous, stop by my <a href="https://www.patreon.com/ironmonk">patreon</a>.

Or [![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/R6R7BH5MT)

Not necessary but definitely appreciated.

## License
This Foundry VTT module, writen by Ironmonk, is licensed under [GNU GPLv3.0](https://www.gnu.org/licenses/gpl-3.0.en.html), supplemented by [Commons Clause](https://commonsclause.com/).

This work is licensed under Foundry Virtual Tabletop <a href="https://foundryvtt.com/article/license/">EULA - Limited License Agreement for module development from May 29, 2020.</a>

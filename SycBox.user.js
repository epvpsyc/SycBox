// ==UserScript==
// @name        SycBox
// @namespace   Elitepvpers
// @description customized ShoutBox
// @include     *//www.elitepvpers.com/forum/
// @author      Syc
// @version     1.1
// @downloadURL https://github.com/epvpsyc/SycBox/raw/master/SycBox.user.js
// @updateURL   https://github.com/epvpsyc/SycBox/raw/master/SycBox.user.js
// @grant       none
// ==/UserScript==
(function ($) {
    // refreshActive will be false for the beginning
    // this is supposed to prevent refreshing the SB before the SB is even properly initialized
    // also don't update while it's updating
    let refreshActive = false;
    let initialLoad = true;

    let chatHistory = [];
    let settings;


    // adding css style this way
    // since github did not like the way of splitting the css into a separate file, loading it from github
    //
    // thanks to Der-Eddy
    function appendStyleRaw(style) {
        if (style) {
            $('<style type="text/css">' + style + '</style>').appendTo('head');
        }
    }

    function updateChatHistory(changes) {
        refreshActive = false;

        // 'changes' will indicate if there is a new message that needs to be added to the SB
        $.ajax({
            url: '//www.elitepvpers.com/forum/mgc_cb_evo_ajax.php',
            type: 'POST',
            dataType: 'xml',
            data: {
                'do': 'ajax_refresh_chat',
                'status': 'open',
                'channel_id': (settings.useEnglishChannel ? 1 : 0),
                'location': 'full',
                'first_load': 1,
                'securitytoken': SECURITYTOKEN,
            }
        }).done(function (data) {
            data = $.parseHTML($(data).find('chatbox_content').text());

            $(data).find('tr.alt2').each(function () {
                let id = parseInt($(this).find('td:first').attr('id').replace('chat_', ''));

                if (!getMessageById(id)) {
                    let $username = $(this).find('td:nth-last-child(2) > span > a');
                    let username = ($username.find('span').length) ? $username.find('span').html() : $username.text().slice(1, -1);
                    let url = $(this).find('td:nth-last-child(2) > span > a').attr('href');
                    let text = $(this).find('td').last().html().trim();
                    if (settings.removeSmileys) text = removeSmileys(text);

                    let message = {
                        'id': id,
                        'time': $(this).find('.mgc_cb_evo_date').text().trim(),
                        'user': {
                            'id': parseInt(url.split('/').pop().split('-')[0]),
                            'url': url,
                            'name': username,
                            'color': ($username.find('span').length) ? $username.find('span').css('color') : 'black',
                        },
                        'text': text,
                        'appended': false,
                    };

                    chatHistory.push(message);
                    changes = true;
                }
            });

            if (changes) {
                appendToSB();
            }

            refreshActive = true;
            initialLoad = false;
        });
    }

    function initTable() {
        let $oldSB = $('tbody#mgc_cb_evo_opened');
        let sbHeight = $oldSB.height();

        $oldSB.parent().html('<tbody id="sycBoxTbody"></tbody>');
        $('#sycBoxTbody').parent().attr('id', 'sycBoxTable');
        let $sycBoxTable = $('#sycBoxTable');

        // title
        $sycBoxTable.before(
            '<div class="sycBoxTitle">e*pvp Premium Shoutbox ' +
            '<span class="thead">[<a target="_blank" href="//www.elitepvpers.com/forum/mgc_cb_evo.php?do=view_archives&amp;page=1">Archiv</a>]</span>' +
            '<span class="thead">[<a id="sycBoxMenuBtn">SycBox</a>]</span>' +
            '</div>'
        );

        // input
        $sycBoxTable.after(
            '<div id="sycBoxInputCon">' +
            '<input type="text" id="sycBoxSend" tabindex="1">' +
            '</div>'
        );

        // set sizes for sb
        $sycBoxTable.css('max-height', sbHeight + 'px');

        updateChatHistory(true);
        initMenu();
        checkForPM();
    }

    function appendToSB() {
        let appended = false;

        chatHistory.reverse().forEach(function (chat, i) {
            if (!chat.appended) {
                chatHistory[i].appended = true;

                let timetitle = (chat.isPM) ? 'Open PM' : 'Add user to input';

                let messageHTML;
                if (chat.isPM) {
                    messageHTML = '<td><span style="color: DarkOrange;">New PM: </span><span title="' + timetitle + '" class="sycBoxTime" data-sycbox-id="' +
                        chat.id + '">' + chat.text + '</span></td>';
                } else {
                    messageHTML = '<td>' + chat.text + '</td>';

                }

                let line = (!checkForMention(chat)) ? '<tr>' : '<tr style="background-color: #ADD8E6;">';

                line +=
                    '<td><span title="' + timetitle + '" class="sycBoxTime" data-sycbox-id="' + chat.id + '">' +
                    chat.time +
                    '</span></td>' +
                    '<td><a class="sycBox" style="color:' + chat.user.color + ';" target="_blank" href="' + chat.user.url + '">' +
                    chat.user.name +
                    '</a></td>' +
                    messageHTML +
                    '</tr>';

                $('#sycBoxTbody').append(line);

                appended = true;
            }
        });

        chatHistory.reverse();

        // in the case of a message actually being added to the SB, scroll down
        if (appended) {
            let $sycBoxTable = $('#sycBoxTable');
            $sycBoxTable.animate({
                scrollTop: $sycBoxTable.prop('scrollHeight')
            });
        }
    }

    function clearSB() {
        chatHistory = [];
        $('#sycBoxTable').find('tr').remove();
    }

    function initMenu() {
        let removeSmileysHtml = (settings.removeSmileys) ? 'checked' : '';
        let useEnglishChannelHtml = (settings.useEnglishChannel) ? 'checked' : '';
        let showNotifications = (settings.showNotifications) ? 'checked' : '';
        let showMentionHighlight = (settings.highlightMentions) ? 'checked' : '';

        $(
            '<div id="sycBoxMenu">' +
            '<div class="sycBoxTitle">sycBox Settings' +
            '<div id="sycBoxMenuClose">x</div>' +
            '</div>' +
            '<div id="sycBoxMenuContent">' +
            '<label>' +
            '<input type="checkbox" data-sycbox-id="removeSmileys" class="sycBoxSetToggle"' + removeSmileysHtml + '>' +
            'Remove smiley images' +
            '</label>' +
            '<label>' +
            '<input type="checkbox" data-sycbox-id="useEnglishChannel" class="sycBoxSetToggle"' + useEnglishChannelHtml + '>' +
            'Use english channel' +
            '</label>' +
            '<label>' +
            '<input type="checkbox" data-sycbox-id="highlightMentions" class="sycBoxSetToggle"' + showMentionHighlight + '>' +
            'Highlight row when mentioned (@' + getUserName() + ')' +
            '</label>' +
            '<label>' +
            '<input type="checkbox" data-sycbox-id="showNotifications" class="sycBoxSetToggle"' + showNotifications + '>' +
            'Show notifications when mentioned (@' + getUserName() + ')' +
            '</label>' +
            '<label>' +
            '<input type="number" data-sycbox-id="fontSize" class="sycBoxSetInput"  min="7" max="99" value="' + settings.fontSize + '" />' +
            ' px Font Size' +
            '</label>' +
            '</div>' +
            '<div class="sycBoxMenuFooter">' +
            '<div id="sycBoxMenuFooterLeft">' +
            'v' + GM_info['script']['version'] +
            '</div>' +
            '<a target="_blank" href="https://github.com/epvpsyc/SycBox">Github</a>' +
            '| &copy;' +
            '<a target="_blank" href="http://www.elitepvpers.com/forum/members/3409936-syc.html">Syc</a>' +
            '</div>' +
            '</div>'
        ).appendTo('body');
    }

    function removeSmileys(text) {
        let smileys = [
            ['smile.gif', ':)'],
            ['confused.gif', ':confused:'],
            ['rtfm.gif', ':rtfm:'],
            ['pimp.gif', ':pimp:'],
            ['mofo.gif', ':mofo:'],
            ['handsdown.gif', ':handsdown:'],
            ['bandit.gif', ':bandit:'],
            ['cool.gif', ':cool:'],
            ['facepalm.gif', ':facepalm:'],
            ['frown.gif', ':('],
            ['mad.gif', ':mad:'],
            ['tongue.gif', ':p'],
            ['wink.gif', ';)'],
            ['biggrin.gif', ':D'],
            ['redface.gif', ':o'],
            ['rolleyes.gif', ':rolleyes:'],
            ['eek.gif', ':eek:'],
            ['awesome.gif', ':awesome:'],
            // new "memes"
            ['lul.png', ':lul:'],
            ['reeee.png', ':reeee:'],
            ['topnep.png', ':topnep:'],
            ['kappapride.png', ':kappapride:'],
            ['wutface.png', ':wutface:'],
            ['4head.png', ':4head:'],
            ['elegiggle.png', ':elegiggle:'],
            ['wojak.png', ':wojak:'],
            ['thinking.png', ':thinking:'],
            ['kappa.png', ':kappa:'],
            ['notsureif.png', ':notsureif:'],
            ['feelsbadman.png', ':feelsbadman:'],
            ['heyguys.png', ':heyguys:'],
            ['pogchamp.png', ':pogchamp:'],
            ['babyrage.png', ':babyrage:'],
            ['kreygasm.png', ':kreygasm:'],
            ['feelsgoodman.png', ':feelsgoodman:'],
            ['rollsafe.png', ':rollsafe:'],
        ];

        smileys.forEach(function (smiley, i) {
            let $html = $('<div>').html(text);
            $html.find('img[src$="' + smileys[i][0] + '"]').replaceWith(smileys[i][1]);
            text = $html.html();
        });

        return $(text).html();
    }

    function getMessageById(id) {
        let message;

        chatHistory.forEach(function (chat) {
            if (chat.id === id) {
                message = chat;
            }
        });

        return message;
    }

    function sendMessage(message) {
        refreshActive = false;
        let channelID = (settings.useEnglishChannel ? 1 : 0);

        let sendAjax = new vB_AJAX_Handler(true);
        sendAjax.send(
            '//www.elitepvpers.com/forum/mgc_cb_evo_ajax.php',
            'do=ajax_chat&channel_id=' + channelID + '&chat=' + PHP.urlencode(message) + '&securitytoken=' + SECURITYTOKEN
        );
        setTimeout(function () {
            updateChatHistory();
        }, 1000);
    }

    function checkForPM() {
        $.get('https://www.elitepvpers.com/forum/private.php', function (data) {
            let $html = $.parseHTML(data);
            $($html).find('form#pmform tbody[id^=collapseobj_pmf0] > tr:first').each(function (i, tr) {
                if ($(tr).find('td:first img').attr('src').includes('www.elitepvpers.com/forum/images/elitepvpers/statusicon/pm_new.gif')) {
                    let id = 'pm' + findGetParameter($(tr).find('td:nth-child(3) div:first a:first').attr('href'), 'pmid');

                    if (!getMessageById(id)) {
                        let userid = $(tr).find('td:nth-child(3) div:nth-child(2) strong span')
                            .attr('onclick').split('/')[1].split('-')[0];

                        let message = {
                            'id': 'pm' + findGetParameter($(tr).find('td:nth-child(3) div:first a:first').attr('href'), 'pmid'),
                            'time': $(tr).find('td:nth-child(3) div:nth-child(2) span:first').text(),
                            'user': {
                                'id': userid,
                                'url': '//www.elitepvpers.com/forum/members/' + userid + '--.html',
                                'name': $(tr).find('td:nth-child(3) div:nth-child(2) strong').text(),
                                'color': 'black',
                            },
                            'text': $(tr).find('td:nth-child(3) div:first a:first').text(),
                            'appended': false,
                            'isPM': true,
                        };

                        chatHistory.push(message);
                        appendToSB();
                    }
                }
            });
        });
    }

    function getUserName() {
        return $('#userbaritems').find('li:first > a').text();
    }

    function requestNotificationPermission() {
        if (!Notification) {
            alert('Desktop notifications not available in your browser. Try Chromium.');
            return;
        }

        if (Notification.permission !== "granted")
            Notification.requestPermission();
    }

    function checkForMention(line) {
        if ($($.parseHTML(line.text)).text().includes('@' + getUserName())) {
            console.log('initial', initialLoad);
            console.log('refresh', refreshActive);
            if (!initialLoad && settings.showNotifications) {
                createNotification(line.user.name, line.text.trim());
            }

            if(settings.highlightMentions) {
                return true;
            }
        }

        return false;

    }

    function createNotification(fromName, text) {
        if (Notification.permission !== "granted")
            Notification.requestPermission();
        else {
            let notification = new Notification(fromName + ' @ Shoutbox', {
                icon: 'https://i.epvpimg.com/jIHYbab.png',
                body: text,
            });

            notification.onclick = function () {
                window.focus();
            };

        }
    }

    function findGetParameter(url, parameterName) {
        let result = null;
        let tmp = [];
        url.split('&').forEach(function (item) {
            tmp = item.split('=');
            if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
        return result;
    }

    function getStorage(key) {
        const settingsDefault = {
            'removeSmileys': true,
            'useEnglishChannel': false,
            'showMentionHighlight': false,
            'showNotifications': false,
            'fontSize': '11',
        };

        let prefix = 'sycBox_';
        let storage = (localStorage.getItem(prefix + key));

        if (storage === null) {
            storage = (key in settingsDefault) ? setStorage(key, settingsDefault[key]) : '';
        } else {
            storage = localStorage.getItem(prefix + key);
        }

        if (storage === 'false') storage = false;
        if (storage === 'true') storage = true;

        return storage;
    }

    function setStorage(key, value) {
        let prefix = 'sycBox_';
        localStorage.setItem(prefix + key, value);
        return value;
    }

    function updateSettings() {
        settings = {
            'removeSmileys': getStorage('removeSmileys'),
            'useEnglishChannel': getStorage('useEnglishChannel'),
            "highlightMentions": getStorage('highlightMentions'),
            'showNotifications': getStorage('showNotifications'),
            'fontSize': getStorage('fontSize'),
        };

        applyCustomStyle();
    }

    function applyCustomStyle() {
        $('#sycBoxTbody td').css('font-size', settings.fontSize + 'px');
        $('#sycBoxSend').css('font-size', settings.fontSize + 'px');
    }

    updateSettings();
    initTable();

    $('#sycBoxSend').keypress(function (e) {
        if (e.which === 13) {
            sendMessage($(this).val());
            $(this).val('');
        }
    });

    $('#sycBoxMenuBtn').on('click', function () {
        $('#sycBoxMenu').toggle();
    });

    $('#sycBoxMenuClose').on('click', function () {
        $('#sycBoxMenu').toggle();
    });

    $('input.sycBoxSetToggle').on('change', function () {
        setStorage($(this).attr('data-sycbox-id'), $(this).is(':checked'));
        updateSettings();

        if ($(this).attr('data-sycbox-id') === 'useEnglishChannel') {
            clearSB();
        }

        if ($(this).attr('data-sycbox-id') === 'showNotifications') {
            requestNotificationPermission();
        }
    });

    $('input.sycBoxSetInput').on('change', function () {
        setStorage($(this).attr('data-sycbox-id'), $(this).val());
        updateSettings();
    });

    $('#sycBoxTbody').on('click', 'span.sycBoxTime', function () {
        let id = $(this).attr('data-sycbox-id');

        if (!id.includes('pm')) {
            let message = getMessageById(parseInt(id));
            let bburl = '@[URL="' + message.user.url + '"]' +
                message.user.name + '[/URL] ';

            let $input = $('#sycBoxSend');
            $input.val($input.val() + bburl);
            $input.focus();
        } else {
            window.open('//www.elitepvpers.com/forum/private.php?do=showpm&pmid=' + id.substring(2), '_blank');
        }
    });

    window.setInterval(function () {
        checkForPM();
        window.clearTimeout(idleTimeout);
    }, 30000);

    window.setInterval(function () {
        if (refreshActive) {
            updateChatHistory();
        }
    }, 5000);

    appendStyleRaw(
        '.sycBoxTitle {\
            padding: 4px;\
            color: white;\
            background: #1c1e20;\
            text-align: center;\
            font: bold 11px tahoma,verdana,geneva,lucida,arial,helvetica,sans-serif;\
        }\
        .sycBoxTitle > span {\
            text-decoration: underline;\
            cursor: pointer;\
        }\
        #sycBoxTable {\
            padding: 2px;\
            border: 1px solid #CCCCCC;\
            background-color: #EDEDED;\
            border-collapse: collapse;\
            border-spacing: 0;\
            display: block;\
            table-layout: fixed;\
            overflow: auto;\
            width: 962px;\
        }\
        #sycBoxTbody td {\
            padding: 1px 2px 1px 2px;\
            vertical-align: top;\
            white-space: nowrap;\
            font-size: ' + settings.fontSize + 'px;\
        }\
        #sycBoxTbody tr td:last-child {\
            width: 100%;\
            word-wrap: break-word;\
            white-space: normal;\
        }\
        #sycBoxSend {\
            height: 15px;\
            width: 100%;\
            margin-right: -3px;\
            padding: 0 2px 0 2px;\
            border: 1px solid #CCCCCC;\
            border-top: 0;\
            box-sizing: border-box;\
            -moz-box-sizing: border-box;\
            font-size: ' + settings.fontSize + 'px;\
        }\
        span.sycBoxTime {\
            cursor: pointer;\
        }\
        #sycBoxMenu {\
            position: absolute;\
            top: 20%;\
            left: 50%;\
            min-height: 50px;\
            width: 350px;\
            margin-left: -175px;\
            display: none;\
            border: 1px solid #CCCCCC;\
            background-color: #EDEDED;\
        }\
        #sycBoxMenuContent {\
            padding: 3px 3px 15px 3px;\
        }\
        #sycBoxMenuContent > label {\
            display: block;\
            padding: 0 0 3px 4px;\
        }\
        input[type="checkbox"].sycBoxSetToggle {\
            position: relative;\
            top: -1px;\
            width: 13px;\
            height: 13px;\
            margin:0;\
            margin-right: 3px;\
            padding: 0;\
            vertical-align: bottom;\
            *overflow: hidden;\
        }\
        input[type="number"].sycBoxSetInput {\
            width: 40px;\
            height: 20px;\
            padding: 2px 2px 0 2px;\
            border: 1px solid #CCCCCC;\
            box-sizing: border-box;\
            -moz-box-sizing: border-box;\
        }\
        #sycBoxMenuClose {\
            position: absolute;\
            top: 0;\
            right: 0;\
            padding: 1px 4px 0 0;\
            color: white;\
            font-size: 14px;\
            cursor: pointer;\
        }\
        .sycBoxMenuFooter {\
            position: absolute;\
            left: 0;\
            right: 0;\
            bottom: 0;\
            padding: 2px;\
            text-align: right;\
            font-size: 10px;\
        }\
        .sycBoxMenuFooter > #sycBoxMenuFooterLeft {\
            position: absolute;\
            bottom: 0;\
            text-align: left;\
        }\
        a:link.sycBox {\
            text-decoration: none;\
        }\
        a:visited.sycBox {\
            text-decoration: none;\
        }\
        a:hover.sycBox {\
            text-decoration: none;\
        }\
        a:active.sycBox {\
            text-decoration: none;\
        }'
    );
})(jQuery);

// ==UserScript==
// @name        SycBox
// @namespace   Elitepvpers
// @description customized ShoutBox
// @include     *//www.elitepvpers.com/forum/
// @author      Syc
// @version     1.0.9
// @downloadURL https://github.com/epvpsyc/SycBox/raw/master/SycBox.user.js
// @updateURL   https://github.com/epvpsyc/SycBox/raw/master/SycBox.user.js
// @grant       none
// ==/UserScript==
(function ($) {
    // refreshActive will be false for the beginning
    // this is supposed to prevent refreshing the SB before the SB is even properly initialized
    let refreshActive = false;

    let chatHistory = [];
    let settings;

    // adding css style this way
    // since github did not like the way of splitting the css into a separate file
    // and loading it from github
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
                    let color = ($username.find('span').length) ? $username.find('span').css('color') : 'black';
                    let username = ($username.find('span').length) ? $username.find('span').html() : $username.text().slice(1, -1);
                    let text = $(this).find('td').last().html().trim();
                    let url = $(this).find('td:nth-last-child(2) > span > a').attr('href');
                    let userid = parseInt(url.split('/').pop().split('-')[0]);

                    text = (settings.removeSmileys) ? removeSmileys(text) : text;

                    let message = {
                        'id': id,
                        'time': $(this).find('.mgc_cb_evo_date').text().trim(),
                        'user': {
                            'id': userid,
                            'url': url,
                            'name': username,
                            'color': color,
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
        });
    }

    function initTable() {
        let $oldSB = $('tbody#mgc_cb_evo_opened');
        let sbWidth = $oldSB.width();
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
        $sycBoxTable.width(sbWidth + 'px');
        $sycBoxTable.css('max-height', sbHeight + 'px');

        updateChatHistory(true);
        initMenu();
    }

    function appendToSB() {
        let appended = false;

        chatHistory.reverse().forEach(function (chat, i) {
            if (!chat.appended) {
                chatHistory[i].appended = true;

                // layout:
                // date | username | message text
                // 13:37 Syc this is an example message

                let line = '<tr>' +
                    '<td><span title="Add user to input" class="sycBoxTime" data-sycbox-id="' + chat.id + '">' +
                    chat.time +
                    '</span></td>' +
                    '<td><a class="sycBox" style="color:' + chat.user.color + ';" target="_blank" href="' + chat.user.url + '">' +
                    chat.user.name +
                    '</a></td>' +
                    '<td>' + chat.text + '</td>' +
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

        updateChatHistory(true);
    }

    function initMenu() {
        let removeSmileysHtml = (settings.removeSmileys) ? 'checked' : '';
        let useEnglishChannelHtml = (settings.useEnglishChannel) ? 'checked' : '';

        $(
            '<div id="sycBoxMenu">' +
            '<div class="sycBoxTitle">sycBox Settings' +
            '<div id="sycBoxMenuClose">x</div>' +
            '</div>' +
            '<div id="sycBoxMenuContent">' +
            '<label>' +
            '<input type="checkbox" data-sycbox-id="removeSmileys" class="sycBoxSetToggle"' + removeSmileysHtml + '>' +
            'remove smiley images' +
            '</label>' +
            '<label>' +
            '<input type="checkbox" data-sycbox-id="useEnglishChannel" class="sycBoxSetToggle"' + useEnglishChannelHtml + '>' +
            'use english channel' +
            '</label>' +
            '</div>' +
            '<div class="sycBoxMenuFooter">' +
            '<div id="sycBoxMenuFooterLeft">' +
            'v' + GM_info['script']['version'] +
            '</div>' +
            '<a target="_blank" href="https://github.com/epvpsyc/SycBox">Github</a> | &copy;<a target="_blank" href="http://www.elitepvpers.com/forum/members/3409936-syc.html">Syc</a>' +
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
        ];

        smileys.forEach(function (smiley, i) {
            let html = $('<div>').html(text);
            html.find('img[src$="' + smileys[i][0] + '"]').replaceWith(smileys[i][1]);
            text = html.html();
        });

        return $(text).html();
    }

    function getMessageById(id) {
        let message = undefined;

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
        sendAjax.send('//www.elitepvpers.com/forum/mgc_cb_evo_ajax.php', 'do=ajax_chat&channel_id=' + channelID + '&chat=' + PHP.urlencode(message) + '&securitytoken=' + SECURITYTOKEN);
        setTimeout(function () {
            updateChatHistory();
        }, 1000);
    }

    function getStorage(key) {
        const settingsDefault = {
            'removeSmileys': true,
            'useEnglishChannel': false,
        };

        let prefix = "sycBox_";
        let storage = (localStorage.getItem(prefix + key));

        if (storage === null) {
            storage = setStorage(key, settingsDefault[key]);
        } else {
            storage = localStorage.getItem(prefix + key);
        }

        storage = (storage === 'false') ? false : storage;
        storage = (storage === 'true') ? true : storage;

        return storage;
    }

    function setStorage(key, value) {
        let prefix = "sycBox_";
        localStorage.setItem(prefix + key, value);
        return value;
    }

    function updateSettings() {
        settings = {
            'removeSmileys': getStorage('removeSmileys'),
            'useEnglishChannel': getStorage('useEnglishChannel'),
        };
    }

    updateSettings();
    initTable();

    $('#sycBoxSend').keypress(function (e) {
        let key = e.which;
        if (key === 13) {
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
    });

    $('#sycBoxTbody').on('click', 'span.sycBoxTime', function () {
        let message = getMessageById(parseInt($(this).attr('data-sycbox-id')));
        let bburl = '@[URL="' + message.user.url + '"]' +
            message.user.name + '[/URL] ';

        let $input = $('#sycBoxSend');
        $input.val($input.val() + bburl);
        $input.focus();
    });

    window.setInterval(function () {
        window.clearTimeout(idleTimeout);
    }, 30000);

    window.setInterval(function () {
        if (refreshActive) {
            updateChatHistory();
        }
    }, 5000);

    // apply css
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
        }\
        #sycBoxTbody {\
            width: 100%;\
        }\
        #sycBoxTbody td {\
            padding: 1px 2px 1px 2px;\
            vertical-align: top;\
            white-space: nowrap;\
            font-size: 11px;\
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
            font-size: 11px;\
            box-sizing: border-box;\
            -moz-box-sizing: border-box;\
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

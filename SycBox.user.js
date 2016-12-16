// ==UserScript==
// @name        SycBox
// @namespace   Elitepvpers
// @description customized ShoutBox
// @include     *//www.elitepvpers.com/forum/
// @author      Syc
// @version     1.0.0
// @downloadURL https://github.com/epvpsyc/SycBox/raw/master/SycBox.user.js
// @updateURL   https://github.com/epvpsyc/SycBox/raw/master/SycBox.user.js
// @grant       none
// ==/UserScript==
(function ($)
{
    // I may or may not feel bad for all of this bad code.

    // refresh will be false for the beginning
    // this is supposed to prevent refreshing the SB before the SB is even properly initialized
    var refresh = false;

    var chat_history = [];
    var settings;

    // adding css style this way
    // since github did not like the way of splitting the css into a separate file
    // and loading it from github
    //
    // thanks to Der-Eddy
    function appendStyleRaw(style)
    {
        if (style) {
            $('<style type="text/css">' + style + '</style>').appendTo('head');
        }
    }

    function updateChatHistory(changes)
    {
        // 'changes' will indicate if there is a new message that needs to be added to the SB

        $.ajax({
            url: '//www.elitepvpers.com/forum/mgc_cb_evo_ajax.php',
            type: 'POST',
            dataType: 'xml',
            data: {
                'do': 'ajax_refresh_chat',
                'status': 'open',
                'channel_id': 0,
                'location': 'full',
                'first_load': 1,
                'securitytoken': SECURITYTOKEN,
                's': ''
            }
        }).done(function (data)
        {
            data = $.parseHTML($(data).find('chatbox_content').text());

            $(data).find('tr.alt2').each(function (i)
            {
                var id = parseInt($(this).find('td:first').attr('id').replace('chat_', ''));

                if (!getMessageById(id)) {
                    var color = ($(this).find('td:nth-last-child(2) > span > a > span').length) ? $(this).find('td:nth-last-child(2) > span > a > span').css('color') : 'black';
                    var username = $(this).find('td:nth-last-child(2) > span > a').text().slice(1, -1);
                    var text = $(this).find('td').last().html().trim();

                    text = (settings.showMemes) ? addMemes(text) : text;

                    // color = (username === "Syc") ? 'green' : color;

                    var message = {
                        'id': id,
                        'time': $(this).find('.mgc_cb_evo_date').text().trim(),
                        'user': {
                            'url': $(this).find('td:nth-last-child(2) > span > a').attr('href'),
                            'name': username,
                            'color': color,
                        },
                        'text': text,
                        'appended': false,
                    };

                    chat_history.push(message);
                    changes = true;
                }
            });

            if (changes) {
                appendToSB();
            }

            refresh = true;
        });
    }

    function initTable()
    {
        var input = $('#mgc_cb_evo_input');
        var sbWidth = $('tbody#mgc_cb_evo_opened').width();
        var sbHeight = $('tbody#mgc_cb_evo_opened').height();

        $('tbody#mgc_cb_evo_opened').parent().html('<tbody id="sycBoxTbody"></tbody>');
        $('#sycBoxTbody').parent().attr("id", "sycBoxTable");

        // title
        $(
            '<div class="sycBoxTitle">e*pvp Premium Shoutbox ' +
            '<span class="thead">[<a target="_blank" href="http://www.elitepvpers.com/forum/mgc_cb_evo.php?do=view_archives&amp;page=1">Archiv</a>]</span>' +
            '<span class="thead">[<a id="sycBoxMenuBtn" style="text-decoration: underline; cursor: pointer;">SycBox</a>]</span>' +
            '</div>'
        ).insertBefore('#sycBoxTable');

        // input
        $(
            '<div id="sycBoxInputCon">' +
            '<form action="http://www.elitepvpers.com/forum/mgc_cb_evo.php" method="post" id="mgc_cb_evo_form" onsubmit="return send_chat()">' +
            '<input type="text" id="mgc_cb_evo_input" name="mgc_cb_evo_input" tabindex="1">' +
            '</form>' +
            '</div>'
        ).insertAfter('#sycBoxTable');

        // set sizes for sb
        $('#sycBoxTable').width(sbWidth + 'px');
        $('#sycBoxTable').css('max-height', sbHeight + 'px');

        updateChatHistory(true);
        initMenu();
    }

    function initMenu()
    {
        var removeSmileysHtml = (settings.removeSmileys) ? 'checked' : '';
        var showMemesHtml = (settings.showMemes) ? 'checked' : '';

        var memeTableHtml = '<table>';
        var memes = getMemes();

        var line = '';

        for (i = 0; i < memes.length; i++) {
            if (i == 0 || memes[i][0] !== memes[i - 1][0]) {
                line = '<tr><td><img width="16" height="16" src="' + memes[i][0] + '" border="0" class="inlineimg"></td><td>';
                line += ' '
            }

            line += memes[i][1];

            if (i === memes.length - 1 || memes[i][0] !== memes[i + 1][0]) {
                line += '</td></tr>';
                memeTableHtml += line;
            } else {
                line += ' ';
            }
        }

        memeTableHtml += '</table>';

        var menuhtml = '<div id="sycBoxMenu">' +
            '<div class="sycBoxTitle">sycBox Settings' +
            '<div id="sycBoxMenuClose">x</div>' +
            '</div>' +
            '<div id="sycBoxMenuContent">' +
            '<label>' +
            '<input type="checkbox" data-sycbox-id="removeSmileys" class="sycBoxSetToggle"' + removeSmileysHtml + '>' +
            'remove smiley images' +
            '</label>' +
            '<br />' +
            '<label>' +
            '<input type="checkbox" data-sycbox-id="showMemes" class="sycBoxSetToggle"' + showMemesHtml + '>' +
            'show custom memes' +
            '</label>' +
            '<br /><br />' +
            memeTableHtml +
            '</div>' +
            '<div class="sycBoxMenuFooter" style="left: 0;">' +
            '<a target="_blank" href="https://github.com/epvpsyc/SycBox/raw/master/SycBox.user.js">Update</a>' +
            '</div>' +
            '<div class="sycBoxMenuFooter" style="right: 0;">' +
            '<a target="_blank" href="https://github.com/epvpsyc/SycBox">Github</a> | &copy;<a target="_blank" href="http://www.elitepvpers.com/forum/members/3409936-syc.html">Syc</a>' +
            '</div>' +
            '</div>';

        $(menuhtml).appendTo('body');
    }

    function appendToSB()
    {
        var appended = false;

        chat_history.reverse().forEach(function (chat, i)
        {
            if (!chat.appended) {
                chat_history[i].appended = true;

                // layout:
                // date | username | message text

                var line = '<tr>' +
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

        chat_history.reverse();

        // in the case of a message actually being added to the SB, scroll down
        if (appended) {
            $('#sycBoxTable').animate({ scrollTop: $('#sycBoxTable').prop('scrollHeight') });
        }

        if (settings.removeSmileys) {
            removeSmileys();
        }
    }

    function addMemes(text)
    {
        var memes = getMemes();

        for (i = 0; i < memes.length; i++) {
            var find = memes[i][1];
            var regex = new RegExp(find, 'g');

            var imghtml = '<img width="16" height="16" src="' + memes[i][0] +
                '" border="0" alt="" title="' + memes[i][2] + '" class="inlineimg">';

            text = text.replace(regex, imghtml);
        }

        return text;
    }

    function getMemes()
    {
        var tfw = 'https://i.imgur.com/DUZLFe6.png';
        var fbm = 'https://i.imgur.com/7PHHNrO.png';
        var fgm = 'https://i.imgur.com/vtttrG2.png';

        var memes = [
            [tfw, ':tfw:', 'that feel when'],
            [tfw, ':thatfeelwhen:', 'that feel when'],
            [fbm, ':feelsbadman:', 'feels bad man'],
            [fbm, ':fbm:', 'feels bad man'],
            [fbm, ':pepe:', 'pepe'],
            [fbm, ':sadfrog:', 'sad frog'],
            [fgm, ':fgm:', 'feels good man'],
            [fgm, ':happyfrog:', 'happy frog'],
            [fgm, ':feelsgoodman:', 'feels good man'],
        ];

        return memes;
    }

    function removeSmileys()
    {
        var smileys = [
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

        for (i = 0; i < smileys.length; i++) {
            $("#sycBoxTable img[src$='" + smileys[i][0] + "']").each(function ()
            {
                $(this).replaceWith(smileys[i][1]);
            });
        }
    }

    function getMessageById(id)
    {
        var message;

        chat_history.forEach(function (chat)
        {
            if (chat.id === id) {
                message = chat;
            }
        });

        return message;
    }

    function getStorage(key, value)
    {
        var prefix = "sycBox_";

        var storage = (localStorage.getItem(prefix + key));

        if (storage === null) {
            storage = setStorage(key, true);
        } else {
            storage = localStorage.getItem(prefix + key);
        }

        storage = (storage === 'false') ? false : storage;
        storage = (storage === 'true') ? true : storage;

        return storage;
    }

    function setStorage(key, value)
    {
        var prefix = "sycBox_";
        localStorage.setItem(prefix + key, value);
        return value;
    }

    function updateSettings()
    {
        settings = {
            'removeSmileys': getStorage('removeSmileys'),
            'showMemes': getStorage('showMemes'),
        };
    }

    updateSettings();
    initTable();

    $('#mgc_cb_evo_input').on('submit', function ()
    {
        refresh = false;
        updateChatHistory();
    });

    $('#sycBoxMenuBtn').on('click', function ()
    {
        $('#sycBoxMenu').toggle();
    });

    $('#sycBoxMenuClose').on('click', function ()
    {
        $('#sycBoxMenu').toggle();
    });

    $('input.sycBoxSetToggle').on('change', function ()
    {
        setStorage($(this).attr('data-sycbox-id'), $(this).is(':checked'));
        updateSettings();
    });

    $('#sycBoxTbody').on('click', 'span.sycBoxTime', function ()
    {
        var message = getMessageById(parseInt($(this).attr('data-sycbox-id')));

        // old: @hh:mm User: 
        // var bburl = '@' + message.time +
        //     ' [URL="' + message.user.url + '"]' +
        //     message.user.name + '[/URL]: ';

        // new: @User: 
        var bburl = '@[URL="' + message.user.url + '"]' +
            message.user.name + '[/URL] ';

        $('#mgc_cb_evo_input').val($('#mgc_cb_evo_input').val() + bburl);
        $('#mgc_cb_evo_input').focus();
    });

    window.setInterval(function ()
    {
        window.clearTimeout(idleTimeout);
    }, 30000);

    window.setInterval(function ()
    {
        if (refresh) {
            updateChatHistory();
        }
    }, 5000);

    // apply css
    appendStyleRaw(
        '.sycBoxTitle { \
            color: white; \
            background: #1c1e20; \
            text-align: center; \
            padding: 4px; \
            font: bold 11px tahoma,verdana,geneva,lucida,arial,helvetica,sans-serif; \
        } \
        #sycBoxTable { \
            padding: 2px; \
            border: 1px solid #CCCCCC; \
            background-color: #EDEDED; \
            border-collapse: collapse; \
            border-spacing: 0; \
            display: block; \
            table-layout: fixed; \
            overflow: auto; \
        } \
        /*#sycBoxTable::-webkit-scrollbar, #sycBoxTbody::-webkit-scrollbar { \
            display: none; \
        } */\
        #sycBoxTbody { \
            width: 100%; \
        } \
        #sycBoxTbody td { \
            font-size: 11px; \
            padding: 1px; \
            padding-right: 2px; \
            vertical-align: top; \
            white-space: nowrap; \
        } \
        #sycBoxTbody tr td:last-child { \
            width: 100%; \
            word-wrap: break-word; \
            white-space: normal; \
        } \
        #mgc_cb_evo_input { \
            width: 100%; \
            margin-right: -3px; \
            border: 1px solid #CCCCCC; \
            border-top: 0; \
            height: 15px; \
            padding-left: 2px; \
            padding-right: 2px; \
            font-size: 11px; \
            box-sizing: border-box; \
            -moz-box-sizing: border-box; \
        } \
        span.sycBoxTime { \
            cursor: pointer; \
        } \
        #sycBoxMenu { \
            position: absolute; \
            display: none; \
            min-height: 50px; \
            width: 350px; \
            border: 1px solid #CCCCCC; \
            background-color: #EDEDED; \
            left: 50%; \
            top: 20%; \
            margin-left: -175px; \
        } \
        #sycBoxMenuContent { \
            padding: 3px; \
            padding-bottom: 20px; \
        } \
        #sycBoxMenuClose { \
            cursor: pointer; \
            position: absolute; \
            right: 0; \
            top: 0; \
            padding-right: 4px; \
            padding-top: 1px; \
            color: white; \
            font-size: 14px; \
        } \
        .sycBoxMenuFooter { \
            position: absolute; \
            bottom: 0; \
            right: 0; \
            padding: 2px; \
            font-size: 10px; \
        } \
        a:link.sycBox { \
            text-decoration: none; \
        } \
        a:visited.sycBox { \
            text-decoration: none; \
        } \
        a:hover.sycBox { \
            text-decoration: none; \
        } \
        a:active.sycBox { \
            text-decoration: none; \
        }'
    );

})(jQuery);
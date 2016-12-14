// ==UserScript==
// @name        SycBox
// @namespace   Elitepvpers
// @description customized ShoutBox
// @include     *//www.elitepvpers.com/forum/
// @author      Syc
// @downloadURL https://github.com/epvpsyc/SycBox/raw/master/SycBox.user.js
// @grant       none
// ==/UserScript==
(function ($)
{
    var refresh = false;
    var chat_history = [];
    var smileys = [
        ['http://www.elitepvpers.com/forum/images/smilies/smile.gif', ':)'],
        ['http://www.elitepvpers.com/forum/images/smilies/confused.gif', ':confused:'],
        ['http://www.elitepvpers.com/forum/images/smilies/rtfm.gif', ':rtfm:'],
        ['http://www.elitepvpers.com/forum/images/smilies/pimp.gif', ':pimp:'],
        ['http://www.elitepvpers.com/forum/images/smilies/mofo.gif', ':mofo:'],
        ['http://www.elitepvpers.com/forum/images/smilies/handsdown.gif', ':handsdown:'],
        ['http://www.elitepvpers.com/forum/images/smilies/bandit.gif', ':bandit:'],
        ['http://www.elitepvpers.com/forum/images/smilies/cool.gif', ':cool:'],
        ['http://www.elitepvpers.com/forum/images/smilies/facepalm.gif', ':facepalm:'],
        ['http://www.elitepvpers.com/forum/images/smilies/frown.gif', ':('],
        ['http://www.elitepvpers.com/forum/images/smilies/mad.gif', ':mad:'],
        ['http://www.elitepvpers.com/forum/images/smilies/tongue.gif', ':p'],
        ['http://www.elitepvpers.com/forum/images/smilies/wink.gif', ';)'],
        ['http://www.elitepvpers.com/forum/images/smilies/biggrin.gif', ':D'],
        ['http://www.elitepvpers.com/forum/images/smilies/redface.gif', ':o'],
        ['http://www.elitepvpers.com/forum/images/smilies/rolleyes.gif', ':rolleyes:'],
        ['http://www.elitepvpers.com/forum/images/smilies/eek.gif', ':eek:'],
        ['http://www.elitepvpers.com/forum/images/smilies/awesome.gif', ':awesome:']
    ];

    initTable();

    function appendStyleRaw(style)
    {
        if (style)
        {
            $('<style type="text/css">' + style + '</style>').appendTo('head');
        }
    }

    function updateChatHistory(changes)
    {
        var content_table = fetch_tags(refreshAjax.handler.responseXML, 'chatbox_content');
        chatbox_content = refreshAjax.fetch_data(content_table[0]);

        $(chatbox_content).find('tr.alt2').each(function (i, tr)
        {
            var id = $(tr).find('td:first').attr('id').replace('chat_', '');
            var id_exists = (getMessageById(id)) ? true : false;

            if (!id_exists)
            {
                var color = ($(tr).find('td:nth-last-child(2) > span > a > span').length) ? $(tr).find('td:nth-last-child(2) > span > a > span').css('color') : 'black';
                var username = $(tr).find('td:nth-last-child(2) > span > a').text().slice(1, -1);
                var text = $(tr).find('td').last().html().trim();

                // color = (username === "Syc") ? 'green' : color;

                var message = {
                    'id': id,
                    'time': $(tr).find('.mgc_cb_evo_date').text().trim(),
                    'user': {
                        'url': $(tr).find('td:nth-last-child(2) > span > a').attr('href'),
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

        if (changes)
        {
            appendSB();
            refresh = true;
        }
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
            '<div id="sycBoxTitle">e*pvp Premium Shoutbox ' +
            '<span class="thead">[<a href="http://www.elitepvpers.com/forum/mgc_cb_evo.php?do=view_archives&amp;page=1">Archiv</a>]</span>' +
            '<span class="thead">[<a href="https://github.com/epvpsyc/SycBox">SycBox</a>]</span>' +
            '</div>'
        ).insertBefore('#sycBoxTable');

        // input 
        $(
            '<div id="sycBoxInputCon">' +
            '<input type="text" id="mgc_cb_evo_input" name="mgc_cb_evo_input" tabindex="1">' +
            '</div>'
        ).insertAfter('#sycBoxTable');

        // set sizes for sb
        $('#sycBoxTable').width(sbWidth + 'px');
        $('#sycBoxTable').css('max-height', sbHeight + 'px');
        $('#sycBoxTbody').css('max-height', sbHeight + 'px');

        updateChatHistory(true);
    }

    function appendSB()
    {
        for (var chat in chat_history.reverse())
        {
            var i = chat;
            chat = chat_history[chat];

            if (!chat.appended)
            {
                chat_history[i].appended = true;

                var line = '<tr><td><span title="Add timestamp + user to input" class="sycBoxTime" data-sycbox-id="' + chat.id + '">' +
                    chat.time + '</span></td><td><a class="sycBox" style="color:' + chat.user.color + ';" href="' + chat.user.url + '">' +
                    chat.user.name + '</a></td><td>' +
                    chat.text + '</td></tr>';
                $('#sycBoxTbody').append(line);
                $("#sycBoxTable").scrollTop($("#sycBoxTable").height());
            }
        }

        removeSmileys();
    }

    function removeSmileys()
    {
        for (i = 0; i < smileys.length; i++)
        {
            $("#sycBoxTable img[src='" + smileys[i][0] + "']").each(function ()
            {
                $(this).replaceWith(smileys[i][1]);
            });
        }
    }

    function getMessageById(id)
    {
        var message = false;

        $.each(chat_history, function (j, elem)
        {
            if (elem.id === id)
            {
                message = elem;
            }
        });

        return message;
    }

    $(".sycBoxTime").click(function ()
    {
        var message = getMessageById($(this).attr('data-sycbox-id'));
        var bburl = '@' + message.time +
            ' [URL="' + message.user.url + '"]' +
            message.user.name + '[/URL]: ';

        $('#mgc_cb_evo_input').val($('#mgc_cb_evo_input').val() + bburl);
    });

    window.setInterval(function ()
    {
        window.clearTimeout(idleTimeout);
    }, 30000);

    window.setInterval(function ()
    {
        if (refresh)
        {
            updateChatHistory();
        }
    }, 5000);

    // apply css
    appendStyleRaw(
        '#sycBoxTitle { \
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
            word-wrap: break-word; \
        } \
        #sycBoxTbody tr td:last-child { \
            width: 100%; \
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
            box-sizing:border-box; \
            -moz-box-sizing:border-box; \
        } \
        span.sycBoxTime { \
            cursor: pointer; \
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

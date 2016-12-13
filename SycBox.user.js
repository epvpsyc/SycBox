// ==UserScript==
// @name        SycBox
// @namespace   Elitepvpers
// @description SB
// @include     *//www.elitepvpers.com/forum/*
// @author      Syc
// @downloadURL https://github.com/epvpsyc/SycBox/raw/master/SycBox.user.js
// @grant       none
// ==/UserScript==
(function ($)
{
    var chat_history = [];

    initTable();

    function updateChatHistory()
    {
        var content_table = fetch_tags(refreshAjax.handler.responseXML, 'chatbox_content');
        chatbox_content = refreshAjax.fetch_data(content_table[0]);

        $(chatbox_content).find('tr.alt2').each(function (i, tr)
        {
            var id = $(tr).find('td:first').attr('id').replace('chat_', '');
            var id_exists = false;

            $.each(chat_history, function (j, elem)
            {
                if (id in elem)
                {
                    id_exists = true;
                }
            });

            if (!id_exists)
            {
                var message = {
                    'id': id,
                    'time': $(tr).find('.mgc_cb_evo_date').text().trim(),
                    'user': {
                        'url': $(tr).find('td:nth-last-child(2) > span > a').attr('href'),
                        'name': $(tr).find('td:nth-last-child(2) > span > a > span').text(),
                        'color': $(tr).find('td:nth-last-child(2) > span > a > span').css('color'),
                    },
                    'text': $(tr).find('td').last().html().trim(),
                    'appended': false,
                };
                chat_history.push(message);
            }
        });

        return chat_history;
    }

    function initTable()
    {
        var input = $('#mgc_cb_evo_input');
        var sbWidth = $('tbody#mgc_cb_evo_opened').width();
        var sbHeight = $('tbody#mgc_cb_evo_opened').height();

        $('tbody#mgc_cb_evo_opened').parent().html('<tbody id="shoutBoxTbody"></tbody>');
        $('#shoutBoxTbody').parent().attr("id", "shoutBoxTable");

        // $('#shoutBoxTbody').append('<tr><td colspan="3"><input type="text" id="mgc_cb_evo_input" name="mgc_cb_evo_input" tabindex="1"></td></tr>');
        $('#shoutBoxTable').width(sbWidth + 'px');
        $('#shoutBoxTable').width(sbHeight + 'px');
    }

    function appendSB() 
    {
        for (var chat in chat_history.reverse())
        {
            chat = chat_history[chat];
            if (!chat['appended'])
            {
                chat_history[chat]['appended'] = true;
                
                var line = '<tr><td>' + chat['time'] + '</td><td style="color:' + chat['user']['color'] + ';"><a href="' + chat['user']['url'] + '">' + chat['user']['name'] + '</a></td><td>' + chat['text'] + '</td></tr>';

                $('#shoutBoxTbody').append(line);
            }
        };
    }

    window.setInterval(function ()
    {
        window.clearTimeout(idleTimeout);
    }, 30000);

    window.setInterval(function ()
    {
        updateChatHistory();
    }, 5000);

    // apply css
    $("head").append($("<link rel='stylesheet' href='https://github.com/epvpsyc/SycBox/raw/master/SycBox.css' type='text/css' media='screen' />"));
})(jQuery);

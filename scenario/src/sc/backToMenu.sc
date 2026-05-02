theme: /

    state: ВернутьсяВМеню
        q!: (~вернись | назад | в меню | главное меню | выход | отмена)
        script:
            log('backToMenu: ' + JSON.stringify($context))
            backToMenu($context)
        random:
            a: Возвращаюсь в меню.
            a: Хорошо, идём в меню.

    state: ВернутьсяВМенюWithPrefix
        q!: (~перейди | ~иди | ~открой) (в меню | на главную | назад)
        script:
            log('backToMenuWithPrefix: ' + JSON.stringify($context))
            backToMenu($context)
        random:
            a: Возвращаюсь в меню.
            a: Хорошо, идём в меню.

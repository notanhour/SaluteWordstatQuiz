theme: /

    state: SelectLeft
        q!: (лево|левой|слева|первый|первый вариант|первая)
        script:
            log('selectLeft: ' + JSON.stringify($context))
            selectLeft($context)
        random:
            a: Левый вариант.

    state: SelectLeftWithPrefix
        q!: (~выбери|~нажми|~скажи) (лево|левой|слева|первый|первый вариант|первая)
        script:
            log('selectLeftWithPrefix: ' + JSON.stringify($context))
            selectLeft($context)
        random:
            a: Левый вариант.

    state: SelectRight
        q!: (право|правой|справа|второй|второй вариант|вторая)
        script:
            log('selectRight: ' + JSON.stringify($context))
            selectRight($context)
        random:
            a: Правый вариант.

    state: SelectRightWithPrefix
        q!: (~выбери|~нажми|~скажи) (право|правой|справа|второй|второй вариант|вторая)
        script:
            log('selectRightWithPrefix: ' + JSON.stringify($context))
            selectRight($context)
        random:
            a: Правый вариант.

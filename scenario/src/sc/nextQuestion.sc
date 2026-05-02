theme: /

    state: СледующийВопрос
        q!: (дальше | следующий | следующий вопрос | продолжить | продолжай | ещё)
        script:
            log('nextQuestion: ' + JSON.stringify($context))
            nextQuestion($context)
        random:
            a: Следующий вопрос.
            a: Идём дальше.

    state: СледующийВопросWithPrefix
        q!: (~давай | ~покажи | ~хочу) (дальше | следующий | следующий вопрос)
        script:
            log('nextQuestionWithPrefix: ' + JSON.stringify($context))
            nextQuestion($context)
        random:
            a: Следующий вопрос.
            a: Идём дальше.

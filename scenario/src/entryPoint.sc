require: slotfilling/slotFilling.sc
  module = sys.zb-common

# Подключение javascript обработчиков
require: js/getters.js
require: js/reply.js
require: js/actions.js

# Подключение сценарных файлов
require: sc/selectCategory.sc
require: sc/selectAnswer.sc
require: sc/backToMenu.sc
require: sc/nextQuestion.sc


patterns:
    $AnyText = $nonEmptyGarbage

theme: /
    state: Start
        q!: $regex</start>
        q!: (запусти | открой | вруби) битва запросов
        a: Начнём.

    state: Fallback
        event!: noMatch
        script:
            log('entryPoint: Fallback: context: ' + JSON.stringify($context))
        a: Я не понимаю

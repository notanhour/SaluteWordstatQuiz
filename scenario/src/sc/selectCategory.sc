theme: /

    state: SelectCategory
        q!: (~выбери|~открой|~покажи|~начни|~запусти|~перейди|~хочу) [категорию|раздел|тему] (еда|фильмы|игры|музыка|спорт|путешествия|технологии|авто)::category
        script:
            log('selectCategory: ' + JSON.stringify($context))
            selectCategory($parseTree._category, $context)
        random:
            a: Хорошо.
            a: Ок.

    state: SelectCategoryShort
        q!: (еда|фильмы|игры|музыка|спорт|путешествия|технологии|авто)::category
        script:
            log('selectCategoryShort: ' + JSON.stringify($context))
            selectCategory($parseTree._category, $context)
        random:
            a: Хорошо.
            a: Ок.

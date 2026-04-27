import React from 'react';
import { createAssistant, createSmartappDebugger } from '@salutejs/client';

import './App.css';
import { GamePage } from './pages/GamePage';
import { TopicSelection } from './pages/TopicSelection';
import wordstatData from './data/wordstat.json';

const AUTO_NEXT_DELAY = 4000;

const initializeAssistant = (getState /*: any*/, getRecoveryState) => {
  const token = process.env.REACT_APP_TOKEN?.trim();
  const smartappName = process.env.REACT_APP_SMARTAPP?.trim();

  if (process.env.NODE_ENV === 'development' && token) {
    return createSmartappDebugger({
      token,
      initPhrase: smartappName ? `Запусти ${smartappName}` : undefined,
      getState,
      nativePanel: {
        defaultText: 'Говорите!',
        screenshotMode: false,
        tabIndex: -1,
      },
    });
  }

  if (process.env.NODE_ENV === 'development' && !token) {
    console.warn('REACT_APP_TOKEN не задан, используем createAssistant без отладки Smartapp Debugger.');
  }

  return createAssistant({ getState });
};

export class App extends React.Component {
  constructor(props) {
    super(props);
    console.log('constructor');

    this.state = {
      notes: [{ id: Math.random().toString(36).substring(7), title: 'тест' }],
      currentScreen: 'menu',
      score: 0,
      currentCategoryId: null,
      currentPair: null,
      answerState: 'idle',
      selectedSide: null,
      history: [],
      questionQueue: [],
    };

    this.nextRoundTimer = null;
    this.assistant = initializeAssistant(() => this.getStateForAssistant());

    this.assistant.on('data', (event /*: any*/) => {
      console.log(`assistant.on(data)`, event);
      if (event.type === 'character') {
        console.log(`assistant.on(data): character: "${event?.character?.id}"`);
      } else if (event.type === 'insets') {
        console.log(`assistant.on(data): insets`);
      } else {
        const { action } = event;
        this.dispatchAssistantAction(action);
      }
    });

    this.assistant.on('start', (event) => {
      const initialData = this.assistant.getInitialData();
      console.log(`assistant.on(start)`, event, initialData);
    });

    this.assistant.on('command', (event) => {
      console.log(`assistant.on(command)`, event);
    });

    this.assistant.on('error', (event) => {
      console.log(`assistant.on(error)`, event);
    });

    this.assistant.on('tts', (event) => {
      console.log(`assistant.on(tts)`, event);
    });
  }

  componentDidMount() {
    console.log('componentDidMount');
  }

  getCategoryById(categoryId) {
    return wordstatData.categories.find((category) => category.id === categoryId);
  }

  shuffleArray(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  createQuestionQueue(category) {
    if (!category?.pairs?.length) {
      return [];
    }
    return this.shuffleArray(category.pairs);
  }

  getRandomPair(category) {
    if (!category?.pairs?.length) {
      return null;
    }
    const index = Math.floor(Math.random() * category.pairs.length);
    return category.pairs[index];
  }

  clearNextRoundTimer() {
    if (this.nextRoundTimer) {
      clearTimeout(this.nextRoundTimer);
      this.nextRoundTimer = null;
    }
  }

  scheduleNextRound() {
    this.clearNextRoundTimer();
    this.nextRoundTimer = setTimeout(() => {
      this.nextRound();
    }, AUTO_NEXT_DELAY);
  }

  startGame(categoryId) {
    const category = this.getCategoryById(categoryId);
    if (!category) {
      return;
    }

    const queue = this.createQuestionQueue(category);
    const [firstPair, ...remaining] = queue;

    this.clearNextRoundTimer();
    this.setState({
      currentScreen: 'game',
      currentCategoryId: category.id,
      currentPair: firstPair || null,
      questionQueue: remaining,
      answerState: 'idle',
      selectedSide: null,
    });
  }

  backToMenu() {
    this.clearNextRoundTimer();
    this.setState({
      currentScreen: 'menu',
      currentPair: null,
      questionQueue: [],
      answerState: 'idle',
      selectedSide: null,
      score: 0,
    });
  }

  handleAnswer(side) {
    const { currentPair, answerState } = this.state;
    if (!currentPair || answerState !== 'idle') {
      return;
    }

    const isTie = currentPair.left_count === currentPair.right_count;
    const correctSide = isTie
      ? side
      : currentPair.left_count > currentPair.right_count
      ? 'left'
      : 'right';

    const isCorrect = isTie || side === correctSide;
    const score = Math.max(0, this.state.score + (isCorrect ? 1 : -1));

    this.setState(
      (prevState) => ({
        score,
        answerState: isCorrect ? 'correct' : 'wrong',
        selectedSide: side,
        history: [
          ...prevState.history,
          {
            categoryId: prevState.currentCategoryId,
            pair: currentPair,
            selectedSide: side,
            correctSide,
            isCorrect,
            timestamp: Date.now(),
          },
        ],
      }),
      () => {
        this.scheduleNextRound();
      }
    );
  }

  nextRound() {
    this.clearNextRoundTimer();
    const category = this.getCategoryById(this.state.currentCategoryId);
    if (!category) {
      return;
    }

    let queue = this.state.questionQueue;
    if (!queue || queue.length === 0) {
      queue = this.createQuestionQueue(category);
    }

    const [nextPair, ...remaining] = queue;
    if (!nextPair) {
      return;
    }

    this.setState({
      currentPair: nextPair,
      questionQueue: remaining,
      answerState: 'idle',
      selectedSide: null,
    });
  }

  getStateForAssistant() {
    console.log('getStateForAssistant: this.state:', this.state);

    const itemSelector = {
      items: this.state.notes.map(({ id, title }, index) => ({
        number: index + 1,
        id,
        title,
      })),
      ignored_words: [
        'добавить', 'установить', 'запиши', 'поставь', 'закинь', 'напомнить',
        'удалить', 'удали',
        'выполни', 'выполнил', 'сделал',
      ],
    };

    const gameState = {
      score: this.state.score,
      categoryId: this.state.currentCategoryId,
      answerState: this.state.answerState,
      selectedSide: this.state.selectedSide,
      currentPair: this.state.currentPair
        ? {
            left: this.state.currentPair.left,
            right: this.state.currentPair.right,
            left_count: this.state.currentPair.left_count,
            right_count: this.state.currentPair.right_count,
          }
        : null,
    };

    const state = {
      item_selector: itemSelector,
      game: gameState,
    };

    console.log('getStateForAssistant: state:', state);
    return state;
  }

  dispatchAssistantAction(action) {
    console.log('dispatchAssistantAction', action);
    if (action) {
      switch (action.type) {
        case 'add_note':
          return this.add_note(action);

        case 'done_note':
          return this.done_note(action);

        case 'delete_note':
          return this.delete_note(action);

        case 'select_left':
          return this.handleAnswer('left');

        case 'select_right':
          return this.handleAnswer('right');

        case 'select_category':
          return this.startGame(action.categoryId);

        default:
          throw new Error(`Unknown action type ${action.type}`);
      }
    }
  }

  add_note(action) {
    console.log('add_note', action);
    this.setState({
      notes: [
        ...this.state.notes,
        {
          id: Math.random().toString(36).substring(7),
          title: action.note,
          completed: false,
        },
      ],
    });
  }

  done_note(action) {
    console.log('done_note', action);
    this.setState({
      notes: this.state.notes.map((note) =>
        note.id === action.id ? { ...note, completed: !note.completed } : note
      ),
    });
  }

  _send_action_value(action_id, value) {
    const data = {
      action: {
        action_id: action_id,
        parameters: {
          value: value,
        },
      },
    };
    const unsubscribe = this.assistant.sendData(data, (data) => {
      const { type, payload } = data;
      console.log('sendData onData:', type, payload);
      unsubscribe();
    });
  }

  play_done_note(id) {
    const completed = this.state.notes.find(({ id }) => id)?.completed;
    if (!completed) {
      const texts = ['Молодец!', 'Красавчик!', 'Супер!'];
      const idx = (Math.random() * texts.length) | 0;
      this._send_action_value('done', texts[idx]);
    }
  }

  delete_note(action) {
    console.log('delete_note', action);
    this.setState({
      notes: this.state.notes.filter(({ id }) => id !== action.id),
    });
  }

  render() {
    console.log('render');

    if (this.state.currentScreen === 'menu') {
      return (
        <TopicSelection
          categories={wordstatData.categories}
          onSelectCategory={(categoryId) => this.startGame(categoryId)}
        />
      );
    }

    const category = this.getCategoryById(this.state.currentCategoryId);

    return (
      <GamePage
        categoryTitle={category?.title}
        currentPair={this.state.currentPair}
        score={this.state.score}
        answerState={this.state.answerState}
        selectedSide={this.state.selectedSide}
        onAnswer={(side) => this.handleAnswer(side)}
        onNext={() => this.nextRound()}
        onBack={() => this.backToMenu()}
      />
    );
  }
}

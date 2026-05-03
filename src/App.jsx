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

    const isTie = currentPair.left_percent === currentPair.right_percent;
    const correctSide = isTie
      ? side
      : currentPair.left_percent > currentPair.right_percent
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

    const gameState = {
      score: this.state.score,
      categoryId: this.state.currentCategoryId,
      answerState: this.state.answerState,
      selectedSide: this.state.selectedSide,
      currentPair: this.state.currentPair
        ? {
            left: this.state.currentPair.left,
            right: this.state.currentPair.right,
            left_percent: this.state.currentPair.left_percent,
            right_percent: this.state.currentPair.right_percent,
          }
        : null,
    };

    const state = {
      game: gameState,
    };

    console.log('getStateForAssistant: state:', state);
    return state;
  }

  dispatchAssistantAction(action) {
    console.log('dispatchAssistantAction', action);
    if (action) {
      switch (action.type) {
        case 'select_left':
          return this.handleAnswer('left');

        case 'select_right':
          return this.handleAnswer('right');

        case 'select_category':
          return this.startGame(action.categoryId);

        case 'back_to_menu':
          return this.backToMenu();

        default:
          console.warn(`dispatchAssistantAction: unknown action type "${action.type}"`);
      }
    }
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

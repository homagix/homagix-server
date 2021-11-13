export type EventType = { name: string };
export type Event = Record<string, unknown>;
export type Listener = (event: Event) => void;

export type Store = {
  dispatch(event: Event): Promise<void>;
  on(type: EventType, func: Listener): Store;
};

export default ({ logger = console }: { logger?: Console }): Store => {
  const listeners = {} as Record<string, Listener[]>;

  async function dispatch(event: Event) {
    try {
      const relevantListeners = listeners[(event as { type: string }).type] || [];
      relevantListeners.forEach((listener) => listener(event));
    } catch (error) {
      logger.error((error as Error).message);
      logger.debug((error as Error).stack);
    }
  }

  return {
    dispatch,

    on(type: EventType, func: Listener): Store {
      listeners[type.name] = listeners[type.name] || [];
      listeners[type.name].push(func);
      return this;
    },
  };
};

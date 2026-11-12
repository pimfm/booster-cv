import { EVENT_NAMES, createEventBus, emit, on } from './events';

describe('event bus', () => {
  it('delivers the detail to listeners of that name only', () => {
    const bus = createEventBus();
    const draw = vi.fn();
    const open = vi.fn();
    bus.on('card:draw', draw);
    bus.on('box:open', open);
    bus.emit('card:draw', { cardId: 'a' });
    expect(draw).toHaveBeenCalledExactlyOnceWith({ cardId: 'a' });
    expect(open).not.toHaveBeenCalled();
    bus.emit('box:open');
    expect(open).toHaveBeenCalledExactlyOnceWith(undefined);
  });

  it('unsubscribes', () => {
    const bus = createEventBus();
    const fn = vi.fn();
    const off = bus.on('all:collected', fn);
    off();
    off(); // twice is fine
    bus.emit('all:collected');
    expect(fn).not.toHaveBeenCalled();
  });

  it('survives a listener unsubscribing during emit', () => {
    const bus = createEventBus();
    const second = vi.fn();
    const off = bus.on('pack:tear', () => off());
    bus.on('pack:tear', second);
    bus.emit('pack:tear', { packId: 'one' });
    bus.emit('pack:tear', { packId: 'one' });
    expect(second).toHaveBeenCalledTimes(2);
  });

  it('emitting without listeners is a no-op', () => {
    expect(() => createEventBus().emit('hold:mark', { mark: 0.33, target: 'box' })).not.toThrow();
  });

  it('exposes the shared bus and all names', () => {
    const fn = vi.fn();
    const off = on('card:collected', fn);
    emit('card:collected', { cardId: 'x' });
    off();
    expect(fn).toHaveBeenCalledOnce();
    expect(EVENT_NAMES).toHaveLength(8);
  });
});

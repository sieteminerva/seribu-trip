export { RenderingEventBus } from "./Rendering";
export { StateMutationEventBus } from "./StateMutation";
export { ElementCreatedEventBus } from "./ElementCreated";

import { RenderingEventBus } from "./Rendering";
import { StateMutationEventBus } from "./StateMutation";
import { ElementCreatedEventBus } from "./ElementCreated";

export class EventBus {
  public static listen(): void {
    RenderingEventBus.listen();
    ElementCreatedEventBus.listen();
    StateMutationEventBus.listen();
  }

  public static shutdown(): void {
    RenderingEventBus.shutdown();
    ElementCreatedEventBus.shutdown();
    StateMutationEventBus.shutdown();
  }
}

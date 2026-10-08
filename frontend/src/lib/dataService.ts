import { hallService } from './services/hallService';
import { eventService } from './services/eventService';
import { attendeeService } from './services/attendeeService';
import { assignmentService } from './services/assignmentService';

export { USE_CSHARP_API } from './config';

export const dataService = {
  ...hallService,
  ...eventService,
  ...attendeeService,
  ...assignmentService,
};

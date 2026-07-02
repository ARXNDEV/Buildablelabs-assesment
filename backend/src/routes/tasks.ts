import { Router, type Request, type Response, type NextFunction, type RequestHandler } from 'express';
import {
  createTaskSchema,
  updateTaskSchema,
  listQuerySchema,
  markRemindedSchema,
} from '../schemas/task.js';
import * as tasks from '../services/tasks.service.js';

/** Wrap async handlers so thrown/rejected errors reach the error middleware. */
const h =
  (fn: (req: Request, res: Response) => Promise<void>): RequestHandler =>
  (req, res, next: NextFunction) =>
    fn(req, res).catch(next);

const router = Router();

// ── Phase-3 support routes (declare before "/:id" so they aren't shadowed) ──

// Open tasks overdue or due today — polled by the daily Discord reminder job.
router.get(
  '/reminders',
  h(async (_req, res) => {
    const data = await tasks.getReminderTasks();
    res.json({ data, count: data.length });
  }),
);

// Mark tasks as reminded (dedupe) after a reminder is sent.
router.post(
  '/reminders/mark',
  h(async (req, res) => {
    const { ids } = markRemindedSchema.parse(req.body);
    const updated = await tasks.markReminded(ids);
    res.json({ updated });
  }),
);

// Weekly rollup consumed by the email-digest workflow.
router.get(
  '/digest',
  h(async (_req, res) => {
    res.json(await tasks.getDigest());
  }),
);

// ── CRUD ────────────────────────────────────────────────────────────────────

router.get(
  '/',
  h(async (req, res) => {
    const query = listQuerySchema.parse(req.query);
    const data = await tasks.listTasks(query);
    res.json({ data, count: data.length });
  }),
);

router.get(
  '/:id',
  h(async (req, res) => {
    res.json({ data: await tasks.getTask(req.params.id as string) });
  }),
);

router.post(
  '/',
  h(async (req, res) => {
    const input = createTaskSchema.parse(req.body);
    const task = await tasks.createTask(input);
    res.status(201).json({ data: task });
  }),
);

router.patch(
  '/:id',
  h(async (req, res) => {
    const input = updateTaskSchema.parse(req.body);
    const task = await tasks.updateTask(req.params.id as string, input);
    res.json({ data: task });
  }),
);

router.delete(
  '/:id',
  h(async (req, res) => {
    await tasks.softDeleteTask(req.params.id as string);
    res.status(204).send();
  }),
);

export default router;

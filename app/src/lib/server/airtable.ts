import "server-only";
import Airtable from "airtable";
import { env } from "./env";
import type { Lead, Admin, ExtractedField } from "@/lib/types";

let _base: Airtable.Base | null = null;

function base(): Airtable.Base {
  if (_base) return _base;
  Airtable.configure({ apiKey: env.airtable.apiKey() });
  _base = Airtable.base(env.airtable.baseId());
  return _base;
}

function leadsTable() {
  return base()(env.airtable.leadsTable());
}

function adminsTable() {
  return base()(env.airtable.adminsTable());
}

/**
 * Airtable field mapping. Keep in sync with the Airtable base schema.
 * If a field is renamed in Airtable, change it here only.
 */
const F = {
  phoneMasked: "Phone (masked)",
  phoneHash: "Phone hash",
  contactName: "Name",
  destination: "Destination",
  travelDates: "Travel dates",
  groupSize: "Group size",
  budget: "Budget",
  classification: "Classification",
  classificationSource: "Classification source",
  classificationReason: "Classification reason",
  assignedTo: "Assigned to",
  status: "Status",
  source: "Source",
  language: "Language",
  startedAt: "Started at",
  lastActivityAt: "Last activity at",
  agentNotifiedAt: "Agent notified at",
  messagesJson: "Messages (JSON)",
  fieldsJson: "Fields (JSON)",
} as const;

function fieldByKey(fields: ExtractedField[], key: ExtractedField["key"]): string | null {
  return fields.find((f) => f.key === key)?.value ?? null;
}

export async function createLead(lead: Lead): Promise<string> {
  const record = await leadsTable().create({
    [F.phoneMasked]: lead.phoneMasked,
    [F.phoneHash]: lead.id,
    [F.contactName]: lead.contactName ?? "",
    [F.destination]: fieldByKey(lead.extractedFields, "destination") ?? "",
    [F.travelDates]: fieldByKey(lead.extractedFields, "travel_dates") ?? "",
    [F.groupSize]: fieldByKey(lead.extractedFields, "group_size") ?? "",
    [F.budget]: fieldByKey(lead.extractedFields, "budget") ?? "",
    [F.classification]: lead.classification,
    [F.classificationSource]: lead.classificationSource,
    [F.classificationReason]: lead.classificationReason ?? "",
    // "Assigned to" is a linked-record field: it takes an array of record IDs.
    ...(lead.assignedToId ? { [F.assignedTo]: [lead.assignedToId] } : {}),
    [F.status]: lead.status,
    [F.source]: lead.source,
    [F.language]: lead.language,
    [F.startedAt]: lead.startedAt,
    [F.lastActivityAt]: lead.lastActivityAt,
    ...(lead.agentNotifiedAt ? { [F.agentNotifiedAt]: lead.agentNotifiedAt } : {}),
    [F.messagesJson]: JSON.stringify(lead.messages),
    [F.fieldsJson]: JSON.stringify(lead.extractedFields),
  });
  return record.id;
}

export async function updateLead(recordId: string, partial: Partial<Lead>): Promise<void> {
  const fields: Record<string, string | string[]> = {};
  if (partial.classification !== undefined) fields[F.classification] = partial.classification;
  if (partial.classificationSource !== undefined)
    fields[F.classificationSource] = partial.classificationSource;
  if (partial.classificationReason !== undefined)
    fields[F.classificationReason] = partial.classificationReason;
  // Linked-record field: pass an array (empty array clears the assignment).
  if (partial.assignedToId !== undefined)
    fields[F.assignedTo] = partial.assignedToId ? [partial.assignedToId] : [];
  if (partial.status !== undefined) fields[F.status] = partial.status;
  if (partial.lastActivityAt !== undefined) fields[F.lastActivityAt] = partial.lastActivityAt;
  if (partial.agentNotifiedAt !== undefined) fields[F.agentNotifiedAt] = partial.agentNotifiedAt;
  if (partial.messages !== undefined) fields[F.messagesJson] = JSON.stringify(partial.messages);
  if (partial.extractedFields !== undefined) {
    fields[F.fieldsJson] = JSON.stringify(partial.extractedFields);
    // Keep the human-readable columns in sync with the latest extraction so the
    // sales team reads current values, not the turn-1 snapshot.
    fields[F.destination] = fieldByKey(partial.extractedFields, "destination") ?? "";
    fields[F.travelDates] = fieldByKey(partial.extractedFields, "travel_dates") ?? "";
    fields[F.groupSize] = fieldByKey(partial.extractedFields, "group_size") ?? "";
    fields[F.budget] = fieldByKey(partial.extractedFields, "budget") ?? "";
  }
  if (partial.contactName !== undefined) fields[F.contactName] = partial.contactName ?? "";
  await leadsTable().update(recordId, fields);
}

export async function findLeadIdByPhoneHash(phoneHash: string): Promise<string | null> {
  const records = await leadsTable()
    .select({
      maxRecords: 1,
      filterByFormula: `{${F.phoneHash}} = '${phoneHash}'`,
    })
    .firstPage();
  return records[0]?.id ?? null;
}

export async function listLeads(): Promise<Lead[]> {
  const records = await leadsTable()
    .select({ sort: [{ field: F.lastActivityAt, direction: "desc" }] })
    .all();

  return records
    // Skip blank placeholder rows (a fresh Airtable base ships with a few).
    // A real lead always has a Phone hash.
    .filter((r) => !!(r.get(F.phoneHash) as string))
    .map((r) => {
      const messages = safeParseJson<Lead["messages"]>(r.get(F.messagesJson) as string) ?? [];
      const extractedFields =
        safeParseJson<Lead["extractedFields"]>(r.get(F.fieldsJson) as string) ?? [];
      const assignedLinks = r.get(F.assignedTo) as string[] | undefined;
      return {
        id: (r.get(F.phoneHash) as string) ?? r.id,
        contactName: ((r.get(F.contactName) as string) ?? null) || null,
        phoneMasked: (r.get(F.phoneMasked) as string) ?? "",
        language: ((r.get(F.language) as string) ?? "en") as Lead["language"],
        source: ((r.get(F.source) as string) ?? "meta_ad") as Lead["source"],
        status: ((r.get(F.status) as string) ?? "in_progress") as Lead["status"],
        classification: ((r.get(F.classification) as string) ??
          "unclassified") as Lead["classification"],
        classificationSource: ((r.get(F.classificationSource) as string) ??
          "model") as Lead["classificationSource"],
        classificationReason: (r.get(F.classificationReason) as string) || undefined,
        assignedToId: Array.isArray(assignedLinks) && assignedLinks.length > 0
          ? assignedLinks[0]
          : null,
        extractedFields,
        messages,
        startedAt: (r.get(F.startedAt) as string) ?? "",
        lastActivityAt: (r.get(F.lastActivityAt) as string) ?? "",
        agentNotifiedAt: (r.get(F.agentNotifiedAt) as string) || undefined,
      };
    });
}

function safeParseJson<T>(raw: string | undefined): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// ── Admins ────────────────────────────────────────────────────────────────────

const AF = {
  name: "Name",
  email: "Email",
  initials: "Initials",
  color: "Color",
  active: "Active",
} as const;

function recordToAdmin(r: Airtable.Record<Airtable.FieldSet>): Admin {
  return {
    id: r.id,
    name: (r.get(AF.name) as string) ?? "",
    email: (r.get(AF.email) as string) ?? "",
    initials: (r.get(AF.initials) as string) ?? "",
    color: (r.get(AF.color) as string) ?? "#6B6B6B",
    active: (r.get(AF.active) as boolean) ?? true,
  };
}

export async function listAdmins(): Promise<Admin[]> {
  const records = await adminsTable()
    .select({ filterByFormula: `{${AF.active}} = 1` })
    .all();
  return records.map(recordToAdmin);
}

export async function createAdmin(
  input: Pick<Admin, "name" | "email" | "initials" | "color">,
): Promise<Admin> {
  const record = await adminsTable().create({
    [AF.name]: input.name,
    [AF.email]: input.email,
    [AF.initials]: input.initials,
    [AF.color]: input.color,
    [AF.active]: true,
  });
  return recordToAdmin(record);
}

export async function deactivateAdmin(recordId: string): Promise<void> {
  await adminsTable().update(recordId, { [AF.active]: false });
}

export async function findAdminByEmail(email: string): Promise<Admin | null> {
  const records = await adminsTable()
    .select({
      maxRecords: 1,
      filterByFormula: `{${AF.email}} = '${email.replace(/'/g, "\\'")}'`,
    })
    .firstPage();
  return records[0] ? recordToAdmin(records[0]) : null;
}

export {
  DEPARTMENTS,
  EMPLOYEES,
  SKILLS,
  type Department,
  type Employee,
  type Skill,
} from "./data/employees.ts";

export {
  searchDepartments,
  searchSkills,
  searchSuggestions,
  type SuggestionOption,
} from "./data/suggestions-api.ts";

export {
  baseFilterFields,
  dateShortcuts,
  dateTimeShortcuts,
  type BaseFilterField,
  type BaseFilterOption,
  type BaseBooleanField,
  type BaseDateField,
  type BaseDateTimeField,
  type BaseNumberField,
  type BaseSelectField,
  type BaseTextField,
  type DateShortcut,
} from "./data/filter-fields.ts";

export {
  integrationGroups,
  tocSections,
  type ExampleLanguage,
  type ExampleVariant,
  type Gate,
  type GroupToggle,
  type IntegrationExample,
  type IntegrationGroup,
  type QuestionGroup,
  type QuestionOption,
  type TileGroup,
  type TocSection,
} from "./integrations/metadata.ts";

"use client";
import Select, { MultiValue, SingleValue, StylesConfig } from "react-select";
import AsyncSelect from "react-select/async";
import CreatableSelect from "react-select/creatable";
import { useForm, Controller } from "react-hook-form";
import { useEffect, useState } from "react";

const DEPS = ["DEV", "QA"] as const;
const ISSUE_TYPES_BY_DEP: Record<string, string[]> = {
  DEV: ["ERROR", "WARNING", "INFO"],
  QA: ["UI", "FUNCTIONAL"],
};
const DESC_TEMPLATE: Record<string, string> = {
  ERROR: "My error is:",
  WARNING: "My warning is:",
  // INFO: "My info is:",
  UI: "My UI issue is:",
  FUNCTIONAL: "My functional issue is:",
};

const sleep = (ms = 1000) => new Promise((resolve) => setTimeout(resolve, ms));

async function loadDeps() {
  await sleep();
  return DEPS;
}

async function loadIssueTypesByDep(dep: string) {
  await sleep();
  return ISSUE_TYPES_BY_DEP[dep].map((iss) => ({
    type: iss,
    template: DESC_TEMPLATE[iss],
  }));
}

type Issue = Awaited<ReturnType<typeof loadIssueTypesByDep>>[number];
type Option = { label: string; value: string };
type IssueOption = Option & Pick<Issue, "template">;

type FormValues = {
  dep: SingleValue<Option>;
  issueType: SingleValue<IssueOption>;
  desc: string;
  cc: MultiValue<Option>;
};

const selectStyles = {
  option: (baseStyles) => ({
    ...baseStyles,
    textTransform: "capitalize",
  }),
  valueContainer: (baseStyles) => ({
    ...baseStyles,
    textTransform: "capitalize",
  }),
} satisfies StylesConfig<Option>;

export default function Home() {
  const {
    control,
    register,
    watch,
    setValue,
    formState: { isValid, errors },
  } = useForm<FormValues>({
    defaultValues: { dep: null, issueType: null, desc: "", cc: [] },
    mode: "onBlur",
  });

  const [issueTypes, setIssueTypes] = useState<IssueOption[]>([]);

  const depLive = watch("dep")?.value;
  const descLive = watch("desc");
  const issueTypeLive = watch("issueType");

  useEffect(() => {
    // TODO fetch in more elegant way (RQ/SWR/RSC, etc)
    if (!depLive) return;

    loadIssueTypesByDep(depLive)
      .then((isstypes) =>
        isstypes.map((iss) => ({
          label: iss.type.toLowerCase(),
          value: iss.type,
          template: iss.template,
        }))
      )
      .then(setIssueTypes);
  }, [depLive]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center container">
      <form>
        <section>
          <Controller
            name="dep"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <AsyncSelect
                {...field}
                styles={selectStyles}
                placeholder="Choose department"
                className="w-72"
                cacheOptions
                defaultOptions
                isSearchable={false}
                // TODO sort by A-Z
                loadOptions={() =>
                  loadDeps().then((deps) =>
                    deps.map((d) => ({ label: d.toLowerCase(), value: d }))
                  )
                }
              />
            )}
          />
          {errors.dep && (
            <span className="text-red-500" role="alert">
              This field is required
            </span>
          )}
        </section>
        <br />
        <section>
          <Controller
            name="issueType"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Select
                {...field}
                onChange={(newValue) => {
                  field.onChange(newValue);
                  setValue("desc", newValue?.template ?? "");
                }}
                styles={selectStyles}
                placeholder="Choose issue type"
                className="w-72"
                isDisabled={!depLive}
                isLoading={false}
                isSearchable={false}
                // TODO sort by A-Z
                options={issueTypes}
              />
            )}
          />
          {errors.issueType && (
            <span className="text-red-500" role="alert">
              This field is required
            </span>
          )}
        </section>
        <br />
        <section>
          <textarea
            {...register("desc", { required: true })}
            cols={28}
            rows={5}
            maxLength={255}
            className="rounded p-4"
            placeholder={
              issueTypeLive?.template ? "" : "Enter your description"
            }
          />
          <div className="text-right">{descLive.length} / 255</div>
          {!!issueTypeLive?.template && (
            <div className="w-72">
              Please provide as many details as per provided template.
            </div>
          )}
          {errors.desc && (
            <span className="text-red-500" role="alert">
              This field is required
            </span>
          )}
        </section>
        <br />
        <section>
          <Controller
            name="cc"
            control={control}
            render={({ field }) => (
              // TODO add email validation (in onCreateOption?)
              <CreatableSelect
                {...field}
                isMulti
                isClearable
                placeholder="Enter your emails"
                className="w-72"
              />
            )}
          />
        </section>
        <br />
        <section>
          <button
            className="rounded bg-blue-500 text-white px-4 py-2 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
            disabled={!isValid}
            type="submit"
          >
            Submit
          </button>
        </section>
      </form>
    </main>
  );
}

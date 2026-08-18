import { redirect } from "next/navigation";
import { AppShell, type SidebarYearItem } from "@/components/layout/app-shell";
import { sortBySchoolYearNameAsc } from "@/lib/school-years";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: schoolYears }, { data: classes }] = await Promise.all([
    supabase.from("profiles").select("full_name, teacher_code").eq("id", user.id).maybeSingle(),
    supabase.from("school_years").select("id, name").is("deleted_at", null),
    supabase
      .from("classes")
      .select("id, name, school_year, school_year_id, grade")
      .is("deleted_at", null)
      .order("name"),
  ]);

  const yearsFromTable: SidebarYearItem[] = (schoolYears ?? []).map((year) => ({
    id: year.id,
    name: year.name,
    classes: [],
  }));

  const yearsById = new Map(yearsFromTable.map((year) => [year.id, year]));
  const yearsByName = new Map(yearsFromTable.map((year) => [year.name, year]));
  const orphanYears = new Map<string, SidebarYearItem>();

  for (const classItem of classes ?? []) {
    const sidebarClass = {
      id: classItem.id,
      name: classItem.name,
      school_year: classItem.school_year,
      school_year_id: classItem.school_year_id,
      grade: classItem.grade,
    };

    let year =
      (classItem.school_year_id ? yearsById.get(classItem.school_year_id) : undefined) ??
      yearsByName.get(classItem.school_year);

    if (!year) {
      const key = classItem.school_year_id ?? classItem.school_year;
      year = orphanYears.get(key);
      if (!year) {
        year = {
          id: key,
          name: classItem.school_year,
          classes: [],
        };
        orphanYears.set(key, year);
      }
    }

    year.classes.push(sidebarClass);
  }

  const years = sortBySchoolYearNameAsc([...yearsFromTable, ...orphanYears.values()]);

  return (
    <AppShell
      fullName={profile?.full_name || user.user_metadata.full_name || "Giáo viên"}
      teacherCode={profile?.teacher_code}
      years={years}
    >
      {children}
    </AppShell>
  );
}

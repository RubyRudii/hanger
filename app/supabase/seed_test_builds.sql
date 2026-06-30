-- Seed 3 fake builds attached to the earliest-created profile (you).
-- Real kit names — these are user-content style examples, fine to use.
-- Safe to delete later: run the DELETE block at the bottom to remove them.

-- Clean up any previous test inserts (incl. any generic-name attempts) so this
-- script can be re-run.
delete from public.builds
 where kit_name in (
   'Nu Gundam Ver. Ka', 'Sazabi Ver. Ka', 'Strike Freedom',
   'Apex Mark VII', 'Crimson Raptor', 'Solaris Strike'
 );

insert into public.builds
  (user_id, kit_name, grade, series, modifications, photo_url, score, scores, verdict, strength, work_on, created_at)
select
  p.id,
  v.kit_name,
  v.grade,
  v.series,
  v.modifications,
  v.photo_url,
  v.score,
  v.scores::jsonb,
  v.verdict,
  v.strength,
  v.work_on,
  v.created_at
from (select id from public.profiles order by created_at asc limit 1) p
cross join (
  values
    (
      'Nu Gundam Ver. Ka', 'MG', 'Char''s Counterattack', 'Panel lined + weathered',
      null,
      94,
      '{"panel_lining":96,"paint_finish":92,"pose_composition":95,"weathering":91,"overall_polish":96}',
      'Exceptional weathering on the fin funnels — almost competition-grade. Wing detailing is crisp and the pose communicates real menace.',
      'Crisp panel lining on the fin funnels',
      'Push the chest weathering one more pass',
      now() - interval '2 hours'
    ),
    (
      'Sazabi Ver. Ka', 'MG', 'Char''s Counterattack', 'Panel lined + weathered',
      null,
      89,
      '{"panel_lining":90,"paint_finish":88,"pose_composition":91,"weathering":86,"overall_polish":90}',
      'Confident build with strong silhouette. Color separation is clean and the funnel array reads dramatic from any angle.',
      'Strong silhouette and pose dynamism',
      'Add more chip wear on the leg armor',
      now() - interval '8 hours'
    ),
    (
      'Strike Freedom', 'RG', 'Gundam SEED Destiny', 'Out of box (snap fit)',
      null,
      82,
      '{"panel_lining":78,"paint_finish":80,"pose_composition":85,"weathering":70,"overall_polish":85}',
      'Clean snap-fit assembly. The articulation lets you nail an iconic flying pose. Weathering would lift this from solid to standout.',
      'Excellent articulation and pose',
      'Add light wash for depth',
      now() - interval '1 day'
    )
) as v(kit_name, grade, series, modifications, photo_url, score, scores, verdict, strength, work_on, created_at);

-- To delete these later, run:
-- delete from public.builds where kit_name in ('Nu Gundam Ver. Ka', 'Sazabi Ver. Ka', 'Strike Freedom');

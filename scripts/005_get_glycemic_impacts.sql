-- Function to calculate glycemic impact for meals
-- Optimized to use auth.uid() for security and LATERAL JOIN for performance

CREATE OR REPLACE FUNCTION get_glycemic_impacts(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  meal_id UUID,
  reading_date DATE,
  pre_meal_time TIME,
  pre_meal_value INTEGER,
  post_meal_time TIME,
  post_meal_value INTEGER,
  impact INTEGER,
  meal_type TEXT,
  carbs INTEGER,
  observations TEXT,
  alimentos_consumidos JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with creator privileges, so we MUST enforce auth.uid() check below
SET search_path = public -- Secure search path
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();

  -- Safety check
  IF current_user_id IS NULL THEN
     RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT
    pre.id AS meal_id,
    pre.reading_date,
    pre.reading_time AS pre_meal_time,
    pre.reading_value AS pre_meal_value,
    post.reading_time AS post_meal_time,
    post.reading_value AS post_meal_value,
    (post.reading_value - pre.reading_value) AS impact,
    pre.refeicao_tipo::TEXT AS meal_type,
    pre.carbs,
    pre.observations,
    pre.alimentos_consumidos
  FROM
    glucose_readings pre
  LEFT JOIN LATERAL (
    SELECT reading_time, reading_value
    FROM glucose_readings post
    WHERE post.user_id = pre.user_id
      AND post.reading_date = pre.reading_date
      AND post.condition = 'apos_refeicao'
      AND post.reading_time > pre.reading_time
      AND post.reading_time <= pre.reading_time + interval '4 hours'
    ORDER BY post.reading_time ASC
    LIMIT 1
  ) post ON TRUE
  WHERE
    pre.user_id = current_user_id -- SECURE: Force filter by auth.uid()
    AND pre.reading_date >= p_start_date
    AND pre.reading_date <= p_end_date
    AND (pre.condition = 'antes_refeicao' OR pre.refeicao_tipo IS NOT NULL)
  ORDER BY pre.reading_date DESC, pre.reading_time DESC;
END;
$$;

-- Grant permissions (Required for Supabase API access)
GRANT EXECUTE ON FUNCTION get_glycemic_impacts(DATE, DATE) TO anon;
GRANT EXECUTE ON FUNCTION get_glycemic_impacts(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_glycemic_impacts(DATE, DATE) TO service_role;

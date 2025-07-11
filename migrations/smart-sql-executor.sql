-- Smart SQL Executor Function for Dynamic AI Queries
-- This function safely executes SELECT queries generated by AI

CREATE OR REPLACE FUNCTION execute_query(query_text TEXT)
RETURNS TABLE(result JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rec RECORD;
    result_array JSONB := '[]'::JSONB;
BEGIN
    -- Security: Only allow SELECT statements
    IF NOT (TRIM(UPPER(query_text)) LIKE 'SELECT%') THEN
        RAISE EXCEPTION 'Only SELECT queries are allowed';
    END IF;
    
    -- Security: Prevent dangerous keywords
    IF UPPER(query_text) ~ '(DELETE|UPDATE|INSERT|DROP|CREATE|ALTER|TRUNCATE|GRANT|REVOKE)' THEN
        RAISE EXCEPTION 'Query contains forbidden keywords';
    END IF;
    
    -- Execute the query and return results as JSONB
    FOR rec IN EXECUTE query_text
    LOOP
        result_array := result_array || to_jsonb(rec);
    END LOOP;
    
    RETURN QUERY SELECT result_array;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION execute_query(TEXT) TO service_role;

-- Example usage:
-- SELECT * FROM execute_query('SELECT COUNT(*) as total_users FROM kd_users');
-- SELECT * FROM execute_query('SELECT gender, COUNT(*) as count FROM kd_users GROUP BY gender'); 
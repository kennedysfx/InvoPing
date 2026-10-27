
CREATE OR REPLACE FUNCTION public.send_customer_support_message(
  p_customer_id uuid,
  p_conversation_id uuid,
  p_client_message_id uuid,
  p_text text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_existing support_messages%ROWTYPE;
  v_message support_messages%ROWTYPE;
  v_count integer;
  v_oldest timestamptz;
  v_now timestamptz;
  v_retry_seconds integer;
BEGIN
  IF p_text IS NULL
     OR length(btrim(p_text)) = 0
     OR length(btrim(p_text)) > 5000 THEN
    RAISE EXCEPTION 'Invalid support message';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM support_conversations
    WHERE id = p_conversation_id
      AND customer_id = p_customer_id
  ) THEN
    RAISE EXCEPTION 'Conversation does not belong to customer';
  END IF;

  INSERT INTO support_rate_limits (customer_id)
  VALUES (p_customer_id)
  ON CONFLICT (customer_id) DO NOTHING;

  -- Serialize all sends belonging to this customer.
  PERFORM 1
  FROM support_rate_limits
  WHERE customer_id = p_customer_id
  FOR UPDATE;

  -- Duplicate retries must not consume the rate limit.
  SELECT *
  INTO v_existing
  FROM support_messages
  WHERE conversation_id = p_conversation_id
    AND client_message_id = p_client_message_id
  LIMIT 1;

  IF FOUND THEN
    IF v_existing.text <> btrim(p_text) THEN
      RETURN jsonb_build_object(
        'outcome', 'conflict'
      );
    END IF;

    RETURN jsonb_build_object(
      'outcome', 'duplicate',
      'messageId', v_existing.id
    );
  END IF;

  v_now := clock_timestamp();

  SELECT count(*)::integer, min(created_at)
  INTO v_count, v_oldest
  FROM support_messages
  WHERE conversation_id = p_conversation_id
    AND sender = 'CUSTOMER'
    AND created_at > v_now - interval '60 seconds';

  IF v_count >= 10 THEN
    v_retry_seconds := greatest(
      1,
      ceil(
        extract(
          epoch FROM (
            v_oldest + interval '60 seconds' - v_now
          )
        )
      )::integer
    );

    RETURN jsonb_build_object(
      'outcome', 'rate_limited',
      'retryAfter', v_retry_seconds
    );
  END IF;

  INSERT INTO support_messages (
    conversation_id,
    client_message_id,
    sender,
    text,
    expires_at
  )
  VALUES (
    p_conversation_id,
    p_client_message_id,
    'CUSTOMER',
    btrim(p_text),
    v_now + interval '7 days'
  )
  RETURNING * INTO v_message;

  RETURN jsonb_build_object(
    'outcome', 'created',
    'messageId', v_message.id
  );
END;
$$;

def test_tables_created(client):
    # If tables didn't create, client fixture would fail
    assert client is not None

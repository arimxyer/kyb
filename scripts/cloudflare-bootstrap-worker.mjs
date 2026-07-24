const maintenanceWorker = {
  fetch() {
    return new Response("Know Your Ballot is preparing its first release.", {
      status: 503,
      headers: {
        "cache-control": "no-store",
        "content-type": "text/plain; charset=utf-8",
        "retry-after": "60",
      },
    });
  },
};

export default maintenanceWorker;

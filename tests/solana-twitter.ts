import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { SolanaTwitter } from '../target/types/solana_twitter';
import * as assert from "assert";

describe('solana-twitter', () => {
  const idl = JSON.parse(
      require("fs").readFileSync("./target/idl/solana_twitter.json", "utf8")
  );

  const programId = new anchor.web3.PublicKey("J76SMEuEvTFHwgUt7AppGYHhTzVd2AZnUdP81WpVfosk")

  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);

  const program = new anchor.Program(idl, programId)

  it('can send a new tweet', async () => {
    // Call the "SendTweet" instruction.
    const tweet = anchor.web3.Keypair.generate();
    await program.rpc.sendTweet('veganism', 'Hummus, am I right?', {
      accounts: {
        tweet: tweet.publicKey,
        author: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [tweet],
    });

    // Fetch the account details of the created tweet.
    const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);

    // Ensure it has the right data.
    assert.equal(tweetAccount.author.toBase58(), provider.wallet.publicKey.toBase58());
    assert.equal(tweetAccount.topic, 'veganism');
    assert.equal(tweetAccount.content, 'Hummus, am I right?');
    assert.ok(tweetAccount.timestamp);
  });
});
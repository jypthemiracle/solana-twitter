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

  it('트윗 하나 계정을 생성하여 전송할 수 있다', async () => {
    // given
    const TOPIC = "WEB3"
    const CONTENT = "Crypto is eating the world"

    // when
    const tweet = anchor.web3.Keypair.generate();
    await program.rpc.sendTweet(TOPIC, CONTENT, {
      accounts: {
        tweet: tweet.publicKey,
        author: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [tweet],
    });

    // then
    const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);

    assert.equal(tweetAccount.author.toBase58(), provider.wallet.publicKey.toBase58());
    assert.equal(tweetAccount.topic, TOPIC);
    assert.equal(tweetAccount.content, CONTENT);
    assert.ok(tweetAccount.timestamp);
  });

  it('토픽 없이 트윗 하나를 생성하여 전송할 수 있다', async() => {
    // given
    const tweet = anchor.web3.Keypair.generate();
    const EMPTY = '';
    const GOOD_MORNING = 'GM';

    // when
    await program.rpc.sendTweet(EMPTY, GOOD_MORNING, {
      accounts: {
        tweet: tweet.publicKey,
        author: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [tweet],
    })

    // then
    const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);

    assert.equal(tweetAccount.author.toBase58(), provider.wallet.publicKey.toBase58());
    assert.equal(tweetAccount.topic, EMPTY);
    assert.equal(tweetAccount.content, GOOD_MORNING);
    assert.ok(tweetAccount.timestamp);
  })
});
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
  });

  it('새로운 사용자가 트윗 하나를 계정 생성하여 전송할 수 있다.', async() => {
    // given
    const user2 = anchor.web3.Keypair.generate();
    const tweet = anchor.web3.Keypair.generate();
    const signature = await provider.connection.requestAirdrop(user2.publicKey, 1000000000);
    await provider.connection.confirmTransaction(signature);

    const TOPIC = "I AM SIGRID JIN";
    const CONTENT = "I LOVE SOLANA IT GOES TO THE MOON"

    // when
    await program.rpc.sendTweet(TOPIC, CONTENT, {
      accounts: {
        tweet: tweet.publicKey,
        author: user2.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [user2, tweet],
    })

    // then
    const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);
    assert.equal(tweetAccount.author.toBase58(), user2.publicKey.toBase58());
    assert.equal(tweetAccount.topic, TOPIC);
    assert.equal(tweetAccount.content, CONTENT);
    assert.ok(tweetAccount.timestamp);
  })

  it('토픽은 50자를 넘길 수 없고, 넘기는 경우 오류를 반환한다.', async() => {
    // given
    const TOPIC_WITH_51_CHARS = 'x'.repeat(51);
    const CONTENT = "Crypto is eating the world";

    // when
    try {
      const tweet = anchor.web3.Keypair.generate();
      await program.rpc.sendTweet(TOPIC_WITH_51_CHARS, CONTENT, {
        accounts: {
          tweet: tweet.publicKey,
          author: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [tweet],
      });
    } catch (error) {
      const ERROR_MESSAGE = error.error.errorMessage;
      assert.equal(ERROR_MESSAGE, '토픽이 50자를 넘겼습니다.')
      return;
    }

    // then
    assert.fail('50자를 넘기지 않았습니다.');
  })

  it('컨텐츠는 280자를 넘길 수 없고, 넘기는 경우 오류를 반환한다.', async() => {
    // given
    const TOPIC = 'WEB3'
    const CONTENT_WITH_281_CHARS = 'x'.repeat(281);

    // when
    try {
      const tweet = anchor.web3.Keypair.generate();
      await program.rpc.sendTweet(TOPIC, CONTENT_WITH_281_CHARS, {
        accounts: {
          tweet: tweet.publicKey,
          author: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [tweet],
      });
    } catch (error) {
      const ERROR_MESSAGE = error.error.errorMessage;
      assert.equal(ERROR_MESSAGE, '내용이 280자를 넘겼습니다.')
      return;
    }

    // then
    assert.fail('내용이 280자를 넘기지 않았습니다.');
  })
});